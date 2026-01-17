#!/bin/bash

# Ngrok Manager for LearnJoy
# Auto-restart ngrok every 12 hours and update redirect service
# Usage: ./ngrok-manager.sh [port] [region] [restart_hours]

NGROK_PORT="${1:-8080}"  # Nginx port (proxies frontend + backend)
NGROK_REGION="${2:-ap}"
RESTART_INTERVAL_HOURS="${3:-12}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NGROK_URL_FILE="$SCRIPT_DIR/current-ngrok-url.txt"
NGROK_HISTORY_FILE="$SCRIPT_DIR/ngrok-url-history.json"
LOG_FILE="$SCRIPT_DIR/ngrok-manager.log"

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message"
    echo "$message" >> "$LOG_FILE"
}

get_ngrok_url() {
    local url=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.proto == "https") | .public_url' 2>/dev/null | head -1)
    echo "$url"
}

stop_ngrok() {
    log "Stopping ngrok..."
    pkill -f ngrok || true
    sleep 2
}

start_ngrok() {
    local port=$1
    log "Starting ngrok on port $port..."
    
    nohup ngrok http $port --region $NGROK_REGION > /dev/null 2>&1 &
    sleep 5
    
    local max_retries=10
    local retry_count=0
    local url=""
    
    while [ $retry_count -lt $max_retries ]; do
        url=$(get_ngrok_url)
        if [ -n "$url" ]; then
            log "Ngrok started successfully: $url"
            echo "$url"
            return 0
        fi
        sleep 2
        ((retry_count++))
    done
    
    log "Failed to start ngrok after $max_retries retries"
    return 1
}

save_ngrok_url() {
    local url=$1
    
    # Save current URL
    echo "$url" > "$NGROK_URL_FILE"
    
    # Update history
    local timestamp=$(date -Iseconds)
    local expires_at=$(date -d "+${RESTART_INTERVAL_HOURS} hours" -Iseconds 2>/dev/null || date -v +${RESTART_INTERVAL_HOURS}H -Iseconds)
    
    local new_entry="{\"url\": \"$url\", \"timestamp\": \"$timestamp\", \"expiresAt\": \"$expires_at\"}"
    
    if [ -f "$NGROK_HISTORY_FILE" ]; then
        # Add to existing history, keep last 10
        local history=$(cat "$NGROK_HISTORY_FILE" | jq ". + [$new_entry] | .[-10:]")
        echo "$history" > "$NGROK_HISTORY_FILE"
    else
        echo "[$new_entry]" > "$NGROK_HISTORY_FILE"
    fi
    
    log "Saved ngrok URL to files"
}

update_redirect_service() {
    local new_url=$1
    
    cat > "$SCRIPT_DIR/redirect.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=$new_url">
    <title>Redirecting to LearnJoy...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        a { color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Redirecting to LearnJoy...</h2>
        <p>If you are not redirected automatically, <a href="$new_url">click here</a></p>
        <p style="font-size: 0.8rem; opacity: 0.7;">Current URL: $new_url</p>
    </div>
    <script>
        window.location.href = "$new_url";
    </script>
</body>
</html>
EOF
    
    log "Updated redirect.html with new URL: $new_url"
}

start_docker_compose() {
    log "Starting Docker Compose with nginx proxy..."
    cd "$PROJECT_DIR"
    # Use ngrok compose file that includes nginx reverse proxy
    docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d
    sleep 15
    log "Docker Compose started (with nginx on port 8080)"
}

check_docker_running() {
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.yml -f docker-compose.ngrok.yml ps --format json 2>/dev/null | jq -e '. | length > 0' > /dev/null 2>&1
}

# Main execution
log "========================================="
log "Ngrok Manager Started"
log "Port: $NGROK_PORT, Region: $NGROK_REGION"
log "Restart Interval: $RESTART_INTERVAL_HOURS hours"
log "========================================="

# Check if Docker Compose is running
cd "$PROJECT_DIR"
if ! check_docker_running; then
    start_docker_compose
fi

# Initial ngrok start
stop_ngrok
current_url=$(start_ngrok $NGROK_PORT)

if [ -n "$current_url" ]; then
    save_ngrok_url "$current_url"
    update_redirect_service "$current_url"
    
    echo ""
    echo "========================================="
    echo "LearnJoy is now accessible at:"
    echo "$current_url"
    echo "========================================="
    echo ""
    echo "Share the redirect page or current URL with your users."
    echo "The URL will be automatically refreshed every $RESTART_INTERVAL_HOURS hours."
    echo ""
fi

# Schedule restart loop
log "Starting auto-restart scheduler (every $RESTART_INTERVAL_HOURS hours)..."

while true; do
    next_restart=$(date -d "+${RESTART_INTERVAL_HOURS} hours" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v +${RESTART_INTERVAL_HOURS}H '+%Y-%m-%d %H:%M:%S')
    log "Next restart scheduled at: $next_restart"
    
    # Wait for restart interval (in seconds)
    sleep $((RESTART_INTERVAL_HOURS * 3600))
    
    log "Performing scheduled restart..."
    stop_ngrok
    current_url=$(start_ngrok $NGROK_PORT)
    
    if [ -n "$current_url" ]; then
        save_ngrok_url "$current_url"
        update_redirect_service "$current_url"
        log "New URL: $current_url"
    else
        log "ERROR: Failed to restart ngrok"
    fi
done
