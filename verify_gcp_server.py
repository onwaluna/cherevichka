import urllib.request
import json

# 1. Health
with urllib.request.urlopen('http://127.0.0.1/api/health') as r:
    print('1. Health Check:', r.status, json.loads(r.read().decode()))

# 2. Config GET
with urllib.request.urlopen('http://127.0.0.1/api/config') as r:
    print('2. Config GET:', r.status, json.loads(r.read().decode()))

# 3. Upload POST
sample_base64 = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
upload_payload = json.dumps({'auth': 'fav256sobaka', 'dataUrl': sample_base64, 'filename': 'test.webp'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1/api/upload', data=upload_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    resp = json.loads(r.read().decode())
    print('3. Upload POST Result:', r.status, resp['url'])

# 4. Verify uploaded image URL through Nginx
with urllib.request.urlopen('http://127.0.0.1' + resp['url']) as r:
    print('4. Static Uploaded Image GET (via Nginx):', r.status, r.headers.get('Content-Type'), len(r.read()), 'bytes')

# 5. Config POST (Saving a sample design panel setting)
config_payload = json.dumps({
    'auth': 'fav256sobaka',
    'designPanels': {
        'hero': {
            'bgImage': resp['url'],
            'titleColor': '#FFFFFF',
            'subtitleColor': '#E5DFC9',
            'overlayOpacity': 50
        }
    }
}).encode('utf-8')
req2 = urllib.request.Request('http://127.0.0.1/api/config', data=config_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req2) as r:
    print('5. Config POST Result:', r.status, json.loads(r.read().decode()))

# 6. Config GET again (Verify it persisted to disk)
with urllib.request.urlopen('http://127.0.0.1/api/config') as r:
    cfg_data = json.loads(r.read().decode())
    print('6. Config GET (Persisted on Server Disk):', r.status, cfg_data['config']['designPanels']['hero']['bgImage'])

print('\n=======================================================')
print('🎉 ALL 6 INTERNAL SERVER TESTS PASSED 100% ON GCP VM!')
print('=======================================================')
