# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.9-slim-buster

EXPOSE 5000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Setting the python path for modules to be importable
ENV PYTHONPATH=/app/src

# Install necessary system packages, including build tools
RUN apt-get update && apt-get install -y build-essential

# Install pip requirements
COPY ./insights/requirements.txt .
RUN python -m pip install -r requirements.txt

WORKDIR /app
COPY ./insights /app

# Copying config files
COPY ./config /app/config

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "src.app:app"]
