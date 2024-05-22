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

});
ScriptApp.onJoinPlayer.Add((player)=>{

  player.tag = {
    isGaming:false
  }

  if(isGaming){
    player.showCenterLabel("관전중이므로, 다음 게임에 참여하세요.",ColorType.YELLOW,ColorType.BLACK,0,10000);
  }

  player.sendMessage(`환영합니다 ${player.name} 님!`);

});


ScriptApp.addOnKeyDown(81, function (player) {

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


ScriptApp.onUnitAttacked.Add((attacker, x,y,target)=>{
  if(attacker.tag.role === "술래"){
    if(target.tag.role === "도망자"){
      announce(`${attacker.name}이 ${target.name}을 잡았습니다.`);
      setSpectator(target);
      updateGamePlayers();

      if(gamingPlayer.filter((player)=>player.tag.role === "도망자").length === 0){
        announce("모든 도망자가 잡혔습니다.");
        startGame();
      }
    }
  }
})



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

function setSpectator(player:ScriptPlayer){
  player.tag.isGaming = false;
  player.tag.role = "관전자";
  player.showCenterLabel("관전중입니다.",ColorType.YELLOW,ColorType.BLACK,0,10000);
  player.title = "관전자";
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
      if(player.tag.role === "술래"){
        ScriptApp.runLater(()=>{
          player.showCenterLabel("술래입니다.",ColorType.RED,ColorType.BLACK,0,10000);
          player.showCenterLabel("10초후에 움직일 수 있습니다.",ColorType.RED,ColorType.BLACK,100,10000);
          player.moveSpeed = 100;
        },10000);
      }else{
        player.moveSpeed = 80;
      }
    },1000);
    player.tag.isGaming = true;
  });

  //도망자로 초기화
  ScriptApp.players.forEach((player)=>{
    player.tag.role = "도망자";
  });

  //술래 정하기
  ScriptApp.players[Math.floor(Math.random()*ScriptApp.playerCount)].tag.role = "술래";

}

function endGame(){
  isGaming = false;
  ScriptApp.players.forEach((player)=>{
    player.tag.isGaming = false;
  });
  gamingPlayer = [];
  ScriptApp.players.forEach((player)=>{
    player.spawnAt(57,57,player.dir);
  });
  ScriptApp.showCenterLabel("술래잡기 게임이 종료되었습니다.");
  ScriptApp.forceDestroy();
}


const FULL_GAME_TIME = 60 * 2;
let playtime = 0;
let tickSecond = 1;
ScriptApp.onUpdate.Add((dt)=>{
  if(tickSecond > 0){
    tickSecond -= dt;
  }else{
    tickSecond = 1;
    playtime++;
    if(playtime >= FULL_GAME_TIME){
      endGame();
    }else{
      let minutes = Math.floor((FULL_GAME_TIME - playtime) / 60);
      let seconds = Math.floor((FULL_GAME_TIME - playtime) % 60);
      let minutes_string = minutes < 10 ? "0" + String(minutes) : String(minutes);
      let seconds_string = seconds < 10 ? "0" + String(seconds) : String(seconds);

      showTimerLabel("main", "⏰ Remaining time : ",`${minutes_string} : ${seconds_string}`);
    }
  }
});

function showTimerLabel(key, text1, text2) {
  const topGap = -2; 

  const labelPercentWidth = 20;
  const labelDisplayTime = 300000;

  const parentStyle = `
  display: flex; 
  align-items: center;
  justify-content: center;
  text-align: center;
  `;

  const firstRowStyle = `
  font-size: 18px;
  font-weight: 700; 
  color: white;`;

  const highlightSpanStyle = `
  font-size: 18px;
  font-weight: 700; 
  color: #FFEB3A;`;

  const customLabelOption = {
    key: key,
    borderRadius: '12px',
    fontOpacity: false,
    padding: '8px 24px',
  }

  let htmlStr = `<span style="${parentStyle}">
    <span style="${firstRowStyle}">${text1}</span>
    <span style="${highlightSpanStyle}">${text2}</span>
  </span>`;
  ScriptApp.showCustomLabel(htmlStr, 0xffffff, 0x27262e, topGap, labelPercentWidth, 0.64, labelDisplayTime, customLabelOption);
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






