# Base image
FROM python:3-alpine

# Set working directory
WORKDIR /vehicle_simulator

# Install poetry
RUN pip install poetry

# Copy the poetry.lock and pyproject.toml files to the working directory
COPY poetry.lock pyproject.toml ./

# Install project dependencies
RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-ansi

# Copy the rest of the project files to the working directory
COPY . .

ENV PYTHONUNBUFFERED 1

# Set the entrypoint command for running the application
CMD ["poetry", "run", "python", "src/main.py"]