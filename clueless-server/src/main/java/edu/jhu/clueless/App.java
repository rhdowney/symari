package edu.jhu.clueless;

import edu.jhu.clueless.network.ClueServer;

// App.java
// Starts server by initializing ClueServer and calling start()

public class App 
{
    public static void main( String[] args )
    {
        int port = 8080; // default port
        ClueServer server = new ClueServer(port);
        server.start();
    }
}
