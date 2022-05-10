

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>

#include <sys/socket.h>
#include <netinet/in.h>

#include <arpa/inet.h>
#include <unistd.h>

#define MAX_SIZE 1024





void error(char *msg)
{
    perror(msg);
    exit(1);
}

int main(int argc, char const *argv[])
{

    // initialize socket variables
    int sockfd, cli_sockfd, portno;
    struct sockaddr_in serv_addr, cli_addr;

    // create socket and check for error
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) < 0)
        error("ERROR opening socket");
    else
        printf("Socket successfully created\n");

    // clear the structure
    bzero(&serv_addr, sizeof(serv_addr));

    // get the port number from the user
    portno = atoi(argv[1]);

    // set server address
    serv_addr.sin_family = AF_INET;         // set the address family
    serv_addr.sin_addr.s_addr = INADDR_ANY; // set the IP address to localhost
    serv_addr.sin_port = htons(portno);     // set the port number

    // bind the socket to the address

    if (bind(sockfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR on binding");
    else
        printf("Socket successfully binded\n");

    // listen on the socket
    if (listen(sockfd, 5) < 0)
        error("ERROR on listening");
    else
        printf("Socket is listening\n");

    // http header
    char header[] = "HTTP/1.1 200 OK\nContent-Type: text/html\n\n";

    // read index.html file
    FILE *fp;

    // receive message
    char buffer[MAX_SIZE];

    char path[] = "/home/hoangdao/Computer_Networks/TCP_connection/HTTP_SERVER_CLIENT/switch/index.html";



    while (1)
    {

        int clilen = sizeof(cli_addr);
        // accept a connection
        cli_sockfd = accept(sockfd, (struct sockaddr *)&cli_addr, &clilen);

        if (cli_sockfd < 0)
            error("ERROR on accept");
        else
            printf("[SERVER]: newSocket is accepted\n");

        printf("Client IP: %s\n", inet_ntoa(cli_addr.sin_addr));
        // // get request from client message and check for error
        if (read(cli_sockfd, buffer, MAX_SIZE) < 0)
            error("ERROR on receiving");
        else
            printf("Message received\n");

        // print the request
        printf("%s\n", buffer);

        // open file
        fp = fopen(path, "r");

        if (fp == NULL)
        {
            perror("file not found");
            exit(1);
        }

        while (fread(buffer, 1, MAX_SIZE, fp) > 0)
        {
            send(cli_sockfd, buffer, MAX_SIZE, 0);
            bzero(buffer, MAX_SIZE);
        }
        fclose(fp);

        close(cli_sockfd);
    }

    close(sockfd);

    return 0;
}
