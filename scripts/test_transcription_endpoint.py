import requests

url = "http://34.41.238.202/api/v1/transcriptions/upload"
with open("output_test.wav", "rb") as f:
    files = {"file": ("test.wav", f, "audio/wav")}
    data = {"apply_qwen_correction": "true", "language": "ar"}
    resp = requests.post(url, files=files, data=data)
    print("Status:", resp.status_code)
    print("Response:", resp.text)
