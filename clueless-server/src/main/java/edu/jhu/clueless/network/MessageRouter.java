package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.network.dto.ServerMessage;
import edu.jhu.clueless.util.JsonUtil;

import java.io.PrintWriter;
import java.util.Map;

public class MessageRouter {
    private final MessageValidator validator;

    public MessageRouter(MessageValidator validator) {
        this.validator = validator;
    }

    public void route(String clientId, ClientMessage msg, PrintWriter out) {
        try {
            validator.validate(msg);

            switch (msg.getType()) {
                case JOIN: {
                    ServerMessage ok = ServerMessage.ok("JOIN_ACK")
                        .withCorrelationId(msg.getCorrelationId())
                        .withPayload("clientId", clientId)
                        .withPayload("playerId", msg.getPlayerId())
                        .withPayload("gameId", msg.getGameId());
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                case MOVE: {
                    ServerMessage ok = ServerMessage.ok("MOVE_ACK")
                        .withCorrelationId(msg.getCorrelationId())
                        .withPayload("playerId", msg.getPlayerId())
                        .withPayload("gameId", msg.getGameId())
                        .withPayload("payload", msg.getPayload());
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                case SUGGESTION: {
                    ServerMessage ok = ServerMessage.ok("SUGGESTION_ACK")
                        .withCorrelationId(msg.getCorrelationId())
                        .withPayload("playerId", msg.getPlayerId())
                        .withPayload("gameId", msg.getGameId())
                        .withPayload("payload", msg.getPayload());
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                case ACCUSATION: {
                    ServerMessage ok = ServerMessage.ok("ACCUSATION_ACK")
                        .withCorrelationId(msg.getCorrelationId())
                        .withPayload("playerId", msg.getPlayerId())
                        .withPayload("gameId", msg.getGameId())
                        .withPayload("payload", msg.getPayload());
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                case CHAT: {
                    Map<String, Object> p = msg.getPayload();
                    Object text = p != null ? p.get("text") : null;
                    ServerMessage ok = ServerMessage.ok("CHAT_ACK")
                        .withCorrelationId(msg.getCorrelationId())
                        .withPayload("from", msg.getPlayerId())
                        .withPayload("text", text);
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                case HEARTBEAT: {
                    ServerMessage ok = ServerMessage.ok("HEARTBEAT_ACK")
                        .withCorrelationId(msg.getCorrelationId());
                    write(out, JsonUtil.toJson(ok));
                    break;
                }

                default: {
                    ServerMessage err = ServerMessage.error("UNKNOWN_TYPE", "Unsupported message type")
                        .withCorrelationId(msg.getCorrelationId());
                    write(out, JsonUtil.toJson(err));
                }
            }
        } catch (IllegalArgumentException ex) {
            ServerMessage err = ServerMessage.error("INVALID", ex.getMessage())
                .withCorrelationId(msg != null ? msg.getCorrelationId() : null);
            write(out, JsonUtil.toJson(err));
        } catch (Exception ex) {
            ServerMessage err = ServerMessage.error("UNEXPECTED", "Internal server error");
            write(out, JsonUtil.toJson(err));
        }
    }

    private void write(PrintWriter out, String json) {
        out.println(json);
        out.flush();
    }
}