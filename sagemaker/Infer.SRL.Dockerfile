FROM docker-dfntc-redhat.di2e.net/ubi7/python-38:latest

WORKDIR /opt/ml
COPY sagemaker .
COPY nlp .
COPY requirements.txt .
RUN pip install -r requirements.txt
ENTRYPOINT python -m sagemaker/srl_handler
