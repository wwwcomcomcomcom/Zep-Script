/**
 * Copyright (c) 2022 ZEP Co., LTD
 */

import "zep-script";
import { ColorType, ScriptPlayer } from "zep-script";


function announce(message: string) {
  ScriptApp.players.forEach((player) => {
    player.sendMessage(message);
  });
}


let isGaming = false;
let gamingPlayer:ScriptPlayer[] =[];

const objectMap:{[keyof:number]:{[keyof:number]:string}} = {
  3:{2:"bascketball",43:"computer",13:"trashcan",67:"speed"},
  // 67:{54:"speed"},
  // 13:{68:"trashcan"}
}

function stunPlayer(player:ScriptPlayer,time:number){
  const prevSpeed = player.moveSpeed
  player.moveSpeed = 0;
  player.sendUpdated();
  announce(`${player.name}이 스턴당했습니다.`);
  setTimeout(()=>{
    player.moveSpeed = prevSpeed;
    player.sendUpdated();
  },time);
}

ScriptApp.onTriggerObject.Add((player, x, y, object)=>{
  const obj = objectMap[x]?.[y];
  // player.sendMessage(`오브젝트를 발견했습니다. ${obj} ${x} ${y}`);
  if(obj === undefined) return;
  if(player.tag.role !== "도망자") return;

  if(player.tag.cooltime === true) return;

  switch (obj) {
    case "bascketball":
      player.showCenterLabel("자유투를 시도했습니다.");
      stunPlayer(player,1000);
      setTimeout(()=>{
        if(Math.random() > 0.5){
          player.showCenterLabel("자유투 성공!");
          playtime += 5;
          announce(`${player.name}이 자유투를 성공했습니다.`);
          announce('제한시간이')
        }else{
          player.showCenterLabel("자유투 실패!");
        }
      },1000);
      break;
    case "speed":
      player.showCenterLabel("속도 증가 아이템을 획득했습니다.");
      player.moveSpeed += 40;
      player.sendUpdated();
      setTimeout(()=>{player.moveSpeed -= 40;player.sendUpdated()},3000);
      break;
    case "computer":
      player.showCenterLabel("게임하느라 시간이 빨리갑니다.");
      ScriptApp.showCenterLabel(`${player.name}이 게임하느라 시간이 빨리갑니다.`,ColorType.YELLOW,ColorType.BLACK,0,5000);
      playtime += 5;
      stunPlayer(player,5000);
      break;
    case "trashcan":
      player.showCenterLabel("쓰레기통을 비워서 선생님이 뛰어도 봐주실듯 하다.");
      player.moveSpeed += 40;
      player.sendUpdated();
      setTimeout(()=>{player.moveSpeed -= 40;player.sendUpdated()},3000);
      break;
  }
  player.tag.cooltime = true;
  setTimeout(()=>{player.tag.cooltime = false},15*1000);
});

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

  ScriptApp.players.forEach((target)=>{
    if(target.id === player.id){
      return;
    }
    const distance = getPlayerDistance(player,target);

    if(player.tag.cooltime ===  true) return;

    if(player.tag.role === "도망자"){
      if(distance<5 && target.tag.role === "술래"){
        player.sendMessage(`${target.name}와 가까워졌습니다.`);
        player.moveSpeed += 40;
        player.sendUpdated();
        setTimeout(()=>{player.moveSpeed -= 40;player.sendUpdated()},3000);
        player.tag.cooltime = true;
        setTimeout(()=>{player.tag.cooltime = false},15*1000);
      };
    }else if(player.tag.role === "술래"){
      if(distance<3){
        player.showCenterLabel("술래가 도망자를 잡으려 합니다.",ColorType.RED,ColorType.BLACK,0,1500);
        target.showCenterLabel("술래가 당신을 잡으려 합니다.",ColorType.RED,ColorType.BLACK,0,1500);
        stunPlayer(target,3000);
        player.tag.cooltime = true;
        setTimeout(()=>{player.tag.cooltime = false},15*1000);
      }
    }

    if(player.tag.cooltime === false){
      player.sendMessage("주변에 플레이어가 없어 시전에 실패했습니다.");
    }
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
        endGame("술래");
      }
    }
  }
})

// ScriptApp.onPlayerTouched.Add((player,target, x, y)=>{
//   if(playtime<10)return;
//   if(player.tag.role === "술래"){
//     if(target.tag.role === "도망자"){
//       announce(`${player.name}이 ${target.name}을 잡았습니다.`);
//       setSpectator(target);
//       updateGamePlayers();

//       if(gamingPlayer.filter((player)=>player.tag.role === "도망자").length === 0){
//         announce("모든 도망자가 잡혔습니다.");
//         endGame("술래");
//       }
//     }
//   }
// });


ScriptApp.onSay.Add((player,message)=>{
  //only admin
  if(player.role < 2000)return;
  switch (message) {
    case "start":
      startGame();
      break;
    case "test":
      stopTimer();
    default:
      break;
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
  player.sendUpdated();
}

function startGame(){
  isGaming = true;
  ScriptApp.players.forEach((player)=>{
    player.tag.isGaming = true;
  });
  updateGamePlayers();

  announce("술래잡기 게임이 시작되었습니다.");

  //도망자로 초기화
  ScriptApp.players.forEach((player)=>{
    player.tag.role = "도망자";
    player.title = "도망자";
  });

  //술래 정하기
  const randomPlayer = ScriptApp.players[Math.floor(Math.random()*ScriptApp.playerCount)];
  randomPlayer.tag.role = "술래";
  randomPlayer.showCenterLabel("당신은 술래입니다.",ColorType.RED,ColorType.BLACK,0,10000);
  randomPlayer.title = "술래";

  ScriptApp.players.forEach((player)=>{
    player.spawnAt(57,57,player.dir);
    player.moveSpeed = 0;
    player.sendUpdated();
    setTimeout(()=>{
      if(player.tag.role === "술래"){
        player.spawnAt(57,60,player.dir);
        setTimeout(()=>{
          player.showCenterLabel("술래입니다.",ColorType.RED,ColorType.BLACK,0,10000);
          player.showCenterLabel("10초후에 움직일 수 있습니다.",ColorType.RED,ColorType.BLACK,100,10000);
          player.moveSpeed = 100;
          player.sendUpdated();
        },3000);
      }else{
        player.moveSpeed = 80;
        player.sendUpdated();
      }
    },1000);
    player.tag.isGaming = true;
  });

  startTimer();
}

function endGame(winner:"도망자"|"술래"){

  if(winner !== undefined){
    if(winner === "도망자")
      announce("도망자가 이겼습니다.");
    else announce("술래가 이겼습니다.");
  }

  isGaming = false;
  ScriptApp.players.forEach((player)=>{
    player.tag.isGaming = false;
    player.tag.role = "관전자";
    player.title = null;
  });
  gamingPlayer = [];
  ScriptApp.players.forEach((player)=>{
    player.spawnAt(57,57,player.dir);
  });
  stopTimer();
  ScriptApp.showCenterLabel(`${winner}가 이겼습니다.`,ColorType.YELLOW,ColorType.BLACK,0,5000);
  ScriptApp.forceDestroy();
}


const FULL_GAME_TIME = 60 * 3;
let playtime = 0;
let tickSecond = 1;
let timerRunning = false;
ScriptApp.onUpdate.Add((dt)=>{

  if(!timerRunning){
    return;
  }

  if(tickSecond > 0){
    tickSecond -= dt;
  }else{
    tickSecond = 1;
    playtime++;
    if(playtime >= FULL_GAME_TIME){
      stopTimer()
      endGame("도망자");
    }else{
      let minutes = Math.floor((FULL_GAME_TIME - playtime) / 60);
      let seconds = Math.floor((FULL_GAME_TIME - playtime) % 60);
      let minutes_string = minutes < 10 ? "0" + String(minutes) : String(minutes);
      let seconds_string = seconds < 10 ? "0" + String(seconds) : String(seconds);

      showTimerLabel("timer", "⏰ Remaining time : ",`${minutes_string} : ${seconds_string}`);
    }
  }
});

function stopTimer(){
  timerRunning = false;
}
/** reset timer and start */
function startTimer(){
  playtime = 0;
  tickSecond = 1;
  timerRunning = true;
}

function showTimerLabel(key, text1, text2) {
  const topGap = 50; 

  const labelPercentWidth = 20;
  const labelDisplayTime = 1500;

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