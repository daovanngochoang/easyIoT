#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>


void main(int argc, char *argv[])
{

    FILE *fp;
    int n;
    char path[] = "/home/hoangdao/Computer_Networks/TCP_connection/HTTP_SERVER_CLIENT/switch/index.html";
    // char *buffer =  malloc(1024 * sizeof(char));

    char buffer[1024];

    fp = fopen(path, "r");
    if (fp == NULL)
    {
        perror("fopen %s");
        exit(1);
    }

    while (fread(buffer, 1, 1024, fp) > 0)
    {
        printf("%s\n", buffer);
        bzero(buffer, 1024);

    }
    fclose(fp);
}