FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install yt-dlp flask flask-cors requests
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["python", "server.py"]
