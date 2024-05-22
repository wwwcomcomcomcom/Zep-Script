/**
 * Copyright (c) 2022 ZEP Co., LTD
 */

import "zep-script";
import { ColorType, ScriptPlayer } from "zep-script";

ScriptApp.showCenterLabel("Hello World");

const adminKey = "admin";

function announce(message: string) {
  ScriptApp.players.forEach((player) => {
    player.sendMessage(message);
  });
}


let isGaming = false;
let gamingPlayer:ScriptPlayer[] =[];


ScriptApp.onDestroy.Add(()=> {
  announce("술래잡기 게임이 종료되었습니다.");
  ScriptMap.clearAllObjects();
});

ScriptApp.onStart.Add(()=>{
  ScriptApp.players.forEach((player)=>{
    player.tag = {
      isGaming:false
    }
  });

  if(ScriptApp.players.length < 3){
    ScriptApp.showCenterLabel("플레이어가 부족합니다.");
    // return;
  }

  startGame();

});
ScriptApp.onJoinPlayer.Add((player)=>{

  player.tag = {
    isGaming:false
  }

  if(isGaming){
    player.hidden = true;
    player.showCenterLabel("관전중이므로, 다른사람에게 보이지 않습니다.",ColorType.YELLOW,ColorType.BLACK,0,10000);
  }

  player.sendMessage(`안녕 ${player.name} 안녕`);

});



ScriptApp.addOnKeyDown(81, function (player) {

  announce(`${player.tileX},${player.tileY}`);

  if(ScriptApp.players.length < 2){
    player.sendMessage("플레이어가 부족합니다.");
    return;
  }

  ScriptApp.players.forEach((target)=>{
    if(target.id === player.id){
      return;
    }
    const distance = getPlayerDistance(player,target);
    announce(`${player.name}와 ${target.name}의 거리는 ${distance}입니다.`);
    if(distance<5){
      player.sendMessage(`${target.name}와 가까워졌습니다.`);
    };
  });
});



ScriptApp.onSay.Add((player,message)=>{


  //only admin
  if(player.role < 2000)return;
  if(message === "test"){
    ScriptApp.players.forEach((player)=>{
      player.spawnAt(57,57,player.dir);
      player.moveSpeed = 0;
      setTimeout(()=>{
        player.moveSpeed = 80;
      },1000);
      player.tag.isGaming = true;
    });
  }
});


function getPlayerVec2(player:ScriptPlayer): Vec2 {
  return new Vec2(player.tileX, player.tileY);
}
function getPlayerDistance(player1:ScriptPlayer,player2: ScriptPlayer): number {
  return getPlayerVec2(player1).getDistance(getPlayerVec2(player2));
}
function updateGamePlayers(){
  gamingPlayer = ScriptApp.players.filter((player)=>player.tag.isGaming);
}
function startGame(){
  isGaming = true;
  ScriptApp.players.forEach((player)=>{
    player.tag.isGaming = true;
  });
  updateGamePlayers();

  announce("술래잡기 게임이 시작되었습니다.");

  ScriptApp.players.forEach((player)=>{
    player.tileX = 57;
    player.tileY = 57;
    player.moveSpeed = 0;
    setTimeout(()=>{
      player.moveSpeed = 80;
    },1000);
    player.tag.isGaming = true;
  });
  
  ScriptApp.players[Math.floor(Math.random()*ScriptApp.playerCount)].tag.isGaming = false;
}













class Vec2 {
  x:number;
  y:number;

  constructor(x:number,y:number){
    this.x=x;
    this.y=y;
  }

  getDistance(vec: Vec2): number {
    const dx = this.x - vec.x;
    const dy = this.y - vec.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}






