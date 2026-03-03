curl --location 'https: //pinova.ai/v1beta/models/gemini-3-pro-image-preview:generateContent' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-E2SRZvb8e4zPW1fmI1QMn9e6PIEGivLW4JOyjelWIiFrZKJc' \
--data '{
    "contents": [
        {
            "role": "user",
            "parts": [
                {
                    "text": "画条狗"
                }
            ]
        }
    ]
}'