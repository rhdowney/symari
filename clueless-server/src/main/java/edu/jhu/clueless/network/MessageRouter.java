package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;
import java.io.PrintWriter;

public class MessageRouter {
    private final MessageValidator validator;

    public MessageRouter(MessageValidator validator) {
        this.validator = validator;
    }

    // Minimal routing stub: validate, branch by type (TODO), and reply with a simple JSON.
    public void route(String clientId, ClientMessage msg, PrintWriter out) {
        try {
            validator.validate(msg);

            switch (msg.getType()) {
                // case MessageType.JOIN:
                //     // TODO: call engine.addPlayer(...); write(out, responseJson);
                //     break;
                // case MessageType.MOVE:
                //     // TODO: engine.handleMove(...); write(out, responseJson);
                //     break;
                // case MessageType.SUGGESTION:
                //     // TODO
                //     break;
                // case MessageType.ACCUSATION:
                //     // TODO
                //     break;
                // case MessageType.CHAT:
                //     // TODO: broadcast to others
                //     break;
                default:
                    write(out, "{\"status\":\"ok\",\"echoType\":\""
                            + (msg.getType() != null ? msg.getType().name() : "UNKNOWN") + "\"}");
            }
        } catch (IllegalArgumentException ex) {
            write(out, "{\"status\":\"error\",\"reason\":\"" + escape(ex.getMessage()) + "\"}");
        } catch (Exception ex) {
            write(out, "{\"status\":\"error\",\"reason\":\"UNEXPECTED\"}");
        }
    }

    private void write(PrintWriter out, String json) {
        out.println(json);
        out.flush();
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }
}