import socket
import os
import threading
import time
import mimetypes
from email.utils import formatdate
import argparse

HOST, PORT = '', 8888
# DOCUMENT_ROOT = ""
DEFAULT_FILE = "index.html"
BUFFER_SIZE = 1024
TIMEOUT_INTERVAL = 30
active_clients = []

# parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("-document_root", "--root", help="root directory", type=str)
parser.add_argument("-port", "--port", help="Port Num", type=int)
args = parser.parse_args()

DOCUMENT_ROOT = args.root
PORT = args.port

class Client:
    def __init__(self, client_socket):
        self.client_socket = client_socket
        self.last_activity_time = time.time()


def timeout_clients(client_list):
    while True:
        time.sleep(1)
        current_time = time.time()
        
        inactive_clients = []

        # heuristic is y = x / (x + 50), as the load increases, the timeout decreases
        # 50 is chosen arbitrarily
        load = (len(active_clients) / (len(active_clients) + 50) ) * TIMEOUT_INTERVAL

        timeout = TIMEOUT_INTERVAL - load

        for client in client_list:
            if current_time - client.last_activity_time > timeout:
                inactive_clients.append(client)
                
        
        # close inactive sockets
        for client in inactive_clients:
            client.client_socket.close()
            active_clients.remove(client)
            

            

def handle_client(client):
    client_socket = client.client_socket
    request_data = client_socket.recv(BUFFER_SIZE).decode('utf-8')
    keep_alive = False
    http_ver = ""

    print(request_data)

    try:
        # Extracting the requested path from the HTTP request
        req = request_data.split("\r\n")
        if req[6].split(" ")[1] == "keep-alive":
            keep_alive = True

        path = (req[0].split(" "))[1]
        http_ver = (req[0].split(" "))[2]
        # print(path + "\n")
        # set default path
        if path == "/":
            path = DEFAULT_FILE

        
        file_path = os.path.join(DOCUMENT_ROOT, path.lstrip("/"))
        print(file_path)
        # Check if the file exists and has proper permissions

        # 200, 404, 403, and 400 response codes
        if os.path.exists(file_path) and os.access(file_path, os.R_OK):
            # Transmit contents of the file to the client
            with open(file_path, 'rb') as fin:
                content = fin.read()
            
            mime_type, encoding = mimetypes.guess_type(file_path)

            # content length and date
            http_response = b"HTTP/1.1 200 OK\r\n" 
            date = formatdate(timeval=None, localtime=False, usegmt=True)
            http_response += f"Date: {date}\r\n".encode()
            http_response += f"Content-Type: {mime_type}\r\n".encode() # mime type
            http_response += f"Content-Length: {len(content)}\r\n".encode()
            http_response += b"Connection: keep-alive\r\n\r\n"
            # print(http_response.decode())
            http_response += content
            # maybe add content type and length
            # print(http_response.decode())
            client_socket.sendall(http_response)
        else:
            # Return appropriate HTTP error message
            response_code = "404 Not Found" if not os.path.exists(file_path) else "403 Forbidden"
            error_response = f"HTTP/1.1 {response_code}\r\n\r\nFile Not Found"
            client_socket.sendall(error_response.encode())

    except ValueError:
        # Malformed HTTP request, send 400 Bad Request
        error_response = b"HTTP/1.1 400 Bad Request\r\n\r\nMalformed Request"
        client_socket.sendall(error_response)

    except Exception as e:
        # print(request_data)
        print(f"Error handling request: {e}")

    # send response

    # set time
    client.last_activity_time = time.time()

    # Close the connection
    if http_ver == "HTTP/1.0":
        client_socket.close()
        active_clients.remove(client)
    #else 
    if http_ver == "HTTP/1.1":
        client_socket.close()

    


def main():
    # ask user for arguments for root and port

    # python webserver.py -document_root "/" -port 8888
    # parser = argparse.ArgumentParser()
    # parser.add_argument("-document_root", "--root", help="root directory", type=str)
    # parser.add_argument("-port", "--port", help="Port Num", type=int)
    # args = parser.parse_args()

    # DOCUMENT_ROOT = args.root
    # print(DOCUMENT_ROOT)
    # PORT = args.port

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(1)
    print(f'Serving HTTP on port {PORT} ...')
    
    # add clients
    timeout_thread = threading.Thread(target=timeout_clients, args=(active_clients,))
    timeout_thread.start()

    try:
    
        while True:
            # event driven, select() + non blocking sockets
            # multithreading, concurrency?
            client_socket, client_address = server_socket.accept()
            client = Client(client_socket)
            active_clients.append(client)
            
            print(f"Accepted connection from {client_address}")

            # Handle the client in a separate function or thread
            client_thread = threading.Thread(target=handle_client, args=(client,))
            client_thread.start()

    except KeyboardInterrupt:
        print("Server shutting down.")
    finally:
        server_socket.close()
        

if __name__ == "__main__":
    main()
