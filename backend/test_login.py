import urllib.request
import urllib.error
import json

data = json.dumps({'email':'admin@igafund.local','password':'Admin123!'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=data, headers={'Content-Type': 'application/json'})

try:
    resp = urllib.request.urlopen(req)
    print("SUCCESS:")
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}:")
    print(e.read().decode())
except Exception as e:
    print("OTHER ERROR:")
    print(e)
