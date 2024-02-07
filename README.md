# Robin Lee

# simple-web-server, Programming Assignment 1

This assignment had us implement a server that could parse and serve HTTP/1.0 and HTTP/1.1 requests.

In our case, we are hosting www.scu.edu 's index.html page.

So, we are just serving the SCU main webpage.

## included files

scuhome directory, downloaded with firefox web browser

## instructions

run

$ python webserver.py -document_root "scuhome/" -port 8000

or

$ python webserver.py -document_root "ROOT_HERE/" -port PORT_NUM


On web browser, visit localhost:8000/