

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>

#include <sys/socket.h>
#include <netinet/in.h>

#include <arpa/inet.h>

#include <time.h>

#define MAX_SIZE 1024

void error(char *msg)
{
    perror(msg);
    exit(1);
}

void HTTP_request(char *serv_ip, int portno)
{
    int sockid;
    // create socket and check for error
    if ((sockid = socket(AF_INET, SOCK_STREAM, 0)) < 0)
        error("ERROR opening socket");
    else
        printf("Socket successfully created\n");

    // clear the structure
    struct sockaddr_in server_address;

    // set server address
    server_address.sin_family = AF_INET;                 // set the address family
    server_address.sin_addr.s_addr = inet_addr(serv_ip); // set the IP address to localhost
    server_address.sin_port = htons(portno);             // set the port number

    // connect to the server
    if (connect(sockid, (struct sockaddr *)&server_address, sizeof(server_address)) < 0)
        error("ERROR connecting");
    else
        printf("Connected to server\n");

    // create GET http request
    char request[MAX_SIZE];
    sprintf(request, "GET / HTTP/1.1\r\n\n\n");

    // send the request to the server
    if (send(sockid, request, strlen(request), 0) < 0)
        error("ERROR sending request");
    else
        printf("Request sent\n");





    // receive the message from the server and write it to the file
    char buffer[MAX_SIZE];
    int n;

    char recv_path[] = "/home/hoangdao/Computer_Networks/TCP_connection/HTTP_SERVER_CLIENT/receive/index.html";
    FILE *recv_fp;

    recv_fp = fopen(recv_path, "w");
    if (recv_fp == NULL)
    {
        perror("cannot open the file");
        exit(1);
    }


    while ((read(sockid, buffer, MAX_SIZE) > 0))
    {
        fwrite(buffer, 1, MAX_SIZE, recv_fp);
        printf("%s\n", buffer);

        bzero(buffer, MAX_SIZE);
    }
    fclose(recv_fp);
}




int main(int argc, char *argv[])
{
    // check if there are enough arguments
    if (argc < 3)
    {
        fprintf(stderr, "ERROR, not enough arguments\n");
        exit(1);
    }
    // get the port number from the user
    int portno = atoi(argv[2]);

    // get the IP address from the user
    char *serv_ip = argv[1];

    // Request the server
    HTTP_request(serv_ip, portno);
    return 0;
}
