FROM python:3.11-slim
RUN pip install yt-dlp flask flask-cors requests
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["python", "server.py"]
