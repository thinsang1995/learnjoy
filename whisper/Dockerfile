FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone and build whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make -j$(nproc)

# Download medium model (good balance of speed/accuracy for Japanese)
RUN cd whisper.cpp && \
    bash ./models/download-ggml-model.sh medium

# Install Python dependencies for API
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy API scripts
COPY api.py /app/
COPY transcribe.sh /app/

# Make scripts executable
RUN chmod +x /app/transcribe.sh

# Create uploads directory
RUN mkdir -p /uploads

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python3", "api.py"]
