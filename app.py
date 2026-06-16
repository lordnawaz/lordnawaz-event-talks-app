import os
import urllib.request
import xml.etree.ElementTree as ET
import re
import html
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_to_text(html_content):
    """Converts HTML content to clean plain text for tweets and search."""
    # Replace links with text (e.g. <a href="url">text</a> -> text)
    # But maybe we can keep the text
    text = re.sub(r'<[^>]+>', '', html_content)
    # Decode HTML entities
    text = html.unescape(text)
    # Replace multiple spaces/newlines with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_release_notes():
    """Fetches the XML feed and parses it into structured updates."""
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        xml_str = xml_data.decode('utf-8')
        # Remove default namespace to ease parsing with xml.etree.ElementTree
        xml_str = re.sub(r'\sxmlns="[^"]+"', '', xml_str, count=1)
        
        root = ET.fromstring(xml_str)
        entries = root.findall('entry')
        
        parsed_entries = []
        update_counter = 0
        
        for entry in entries:
            date_title = entry.find('title').text if entry.find('title') is not None else "Unknown Date"
            updated_iso = entry.find('updated').text if entry.find('updated') is not None else ""
            
            link_elem = entry.find('link')
            link_url = ""
            if link_elem is not None:
                link_url = link_elem.get('href', '')
            
            content_elem = entry.find('content')
            content_html = content_elem.text if content_elem is not None else ""
            
            # Split the HTML content by <h3> headers to isolate separate updates
            parts = re.split(r'<h3>(.*?)</h3>', content_html)
            entry_updates = []
            
            if len(parts) > 1:
                # If h3 headings were found, they split the content
                # parts[0] is everything before first <h3>
                # parts[1] is update type (e.g. "Feature"), parts[2] is update body HTML
                for i in range(1, len(parts), 2):
                    update_type = parts[i].strip()
                    update_body = parts[i+1].strip()
                    
                    update_text = clean_html_to_text(update_body)
                    
                    # Create a unique ID for selection tracking
                    update_id = f"up-{update_counter}"
                    update_counter += 1
                    
                    entry_updates.append({
                        'id': update_id,
                        'type': update_type,
                        'html': update_body,
                        'text': update_text
                    })
            else:
                # No <h3> headings found, treat entire block as one update
                if content_html.strip():
                    update_text = clean_html_to_text(content_html)
                    update_id = f"up-{update_counter}"
                    update_counter += 1
                    entry_updates.append({
                        'id': update_id,
                        'type': 'General',
                        'html': content_html.strip(),
                        'text': update_text
                    })
            
            if entry_updates:
                parsed_entries.append({
                    'date': date_title,
                    'date_iso': updated_iso,
                    'url': link_url,
                    'updates': entry_updates
                })
                
        return {
            'success': True,
            'feed_title': root.find('title').text if root.find('title') is not None else "BigQuery Release Notes",
            'entries': parsed_entries
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    # Allow force refreshing or caching if needed
    data = parse_release_notes()
    return jsonify(data)

if __name__ == '__main__':
    # Bind to all interfaces to make it accessible in container/local environments
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
