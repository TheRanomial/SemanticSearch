import sys
import json
from mistralai.client import MistralClient

def main(sentences):
    client = MistralClient(api_key="YOUR_API_KEY")
    input_sentences = sentences.split('|')

    embeddings_batch_response = client.embeddings(
        model="mistral-embed",
        input=input_sentences,
    )

    # Output the embeddings as JSON
    return embeddings_batch_response.data[0].embedding

if __name__ == "__main__":
    sentences = sys.argv[1]
    main(sentences)
