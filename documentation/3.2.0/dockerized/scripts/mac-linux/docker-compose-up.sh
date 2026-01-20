#!/bin/bash

# Get the directory of the shell script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set environment variables
export notification_env="$SCRIPT_DIR/notification_env"
export scheduler_env="$SCRIPT_DIR/scheduler_env"
export mentoring_env="$SCRIPT_DIR/mentoring_env"
export users_env="$SCRIPT_DIR/user_env"
export interface_env="$SCRIPT_DIR/interface_env"
export chatcommunication_env="$SCRIPT_DIR/chatcommunication_env"
export MENTORING_CONFIG_FILE="$SCRIPT_DIR/config.json"
export elevate_portal_env="$SCRIPT_DIR/elevate_portal_env"

# Run docker-compose
docker-compose -f "$SCRIPT_DIR/docker-compose-mentoring.yml" up -d

