package edu.jhu.clueless.engine;

import java.util.*;

public class GameState {
    private Map<String, Player> players = new LinkedHashMap<>();
    private Map<String, Room> rooms = new LinkedHashMap<>();
    private List<Weapon> weapons = new ArrayList<>();
    private Player currentPlayer;

    public void addPlayer(Player player){
        players.put(player.getName(), player);
    }

    public void addRoom(Room room){
        rooms.put(room.getName(), room);
    }

    public Player getPlayer(String name){
        return players.get(name);
    }

    public Room getRoom(String name){
        return rooms.get(name);
    }

    public Player getCurrentPlayer(){
        return currentPlayer;
    }

    public void setCurrentPlayer(Player currentPlayer){
        this.currentPlayer = currentPlayer;
    }

    public Collection<Player> getPlayers() { return players.values(); }
    public Collection<Room> getRooms() { return rooms.values(); }









}
