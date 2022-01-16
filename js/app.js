// This is a JavaScript file
var app = angular.module('myApp',['onsen']);
ons.disableAutoStatusBarFill();//ステータスバーの補完を無効化
app.directive('youtube', function($window){
  var _link = function(scope, element, attr){
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var lastSelected=window.localStorage.getItem('select');
    var videoSpeed=lastSelected;
    if(lastSelected==null)videoSpeed="1.00";
    var player;
    $window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player(element.children()[0], {
        width: "100%",
        height: "100%",
        videoId: youtubeId,
        playerVars: {
          playsinline:1,
          controls: 0 
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange':onPlayerStateChange,
        }
      });
    }
    function onPlayerReady(event) {
      event.target.setPlaybackRate(Number(videoSpeed));
      player.seekTo(startTime,true);
    }

    var timer;//タイマーを設置
    function onPlayerStateChange(event) {
      if(event.data == YT.PlayerState.PLAYING) { //eventが「再生中」の場合
        timer = setInterval(endVideo,1); //タイマーで1ミリ秒ごとに監視
        document.getElementById('player').classList.remove('fa-play');
        document.getElementById('player').classList.add('fa-pause');
      }else{
        clearInterval(timer); // 再生時間の監視停止
        timer = null;
        document.getElementById('player').classList.remove('fa-pause');
        document.getElementById('player').classList.add('fa-play');
      }
    }

    function endVideo(){//動画が終了時間に達した場合の処理
      if(player.getCurrentTime() > endTime){ //現在の時刻が終了時間を超えた場合
        player.pauseVideo(); 
      }
    }

    window.repeatVideo=function() {//動画の繰り返し再生の処理
       player.seekTo(startTime,true).playVideo(); //再生時間にシーク後再生
    }

    window.playVideo=function(){
      if(player.getCurrentTime() > endTime){ //現在の時刻が終了時間を超えた場合
        player.seekTo(startTime,true).playVideo();
      }else if(document.getElementById('player').classList.contains('fa-pause')==true){
        player.pauseVideo(); 
      }else{
        player.playVideo();
      }
    }
  };

  return {
    link: _link,
    scope: {
      width: "@",
      height: "@",
      youtubeId: "@",
      startTime:"@"
    },
    restrict: 'E',
    template: '<div></div>',
  };
});

app.controller('topCtrl',function(titleService,$scope,$window){
  this.title=JSON.parse(JSON.stringify(titleService.titles));//titleServiceからデータを取得
  this.totalNum=myNavigator.getCurrentPage().options.totalNum;
  this.gameStart=function(index){
    myNavigator.pushPage('game.html',{youtubeId:this.title[index].youtubeId,itemName:this.title[index].itemName,json:this.title[index].json});
  }
  this.menu=function(){
    myNavigator.pushPage('menu.html',{animation:"lift"});
  }
});

app.controller('menuCtrl',function(titleService){
  var select = document.querySelector(".videoSpeed");
  var lastSelected = window.localStorage.getItem('select');
  if(lastSelected==null) {
    select.value ="1.00"; 
  }else{
    select.value = lastSelected;
  }
  select.onchange = function () {
    lastSelected = select.options[select.selectedIndex].value;
    window.localStorage.setItem('select', lastSelected);
  }

  this.removeStorageAlert=function(){
     ons.notification.confirm({
      messageHTML: '全ファイルの進捗状況が削除されます',
      title: 'ローカルストレージを削除',
      buttonLabels: ['キャンセル','実行'],
      primaryButtonIndex:0,
      cancelable:true,
      animation: 'default',
      callback: function(index) {
        if(index == 1){
          this.title=JSON.parse(JSON.stringify(titleService.titles));
          for(var i=0;i<this.title.length;i++){
            window.localStorage.removeItem(this.title[i].itemName);
          };
          ons.notification.alert({
            messageHTML: '削除が完了しました',
            title: '',
            buttonLabel: 'OK',
            animation: 'default',
        });
        }
      }
    });
  }

  this.openTwitter=function(){
    cordova.InAppBrowser.open("https://twitter.com/app63308446","_system",'location=no');
  };

  this.openAppstore=function(){
    cordova.InAppBrowser.open("https://apps.apple.com/jp/app/%E5%8B%95%E7%94%BB%E3%81%A7%E5%AD%A6%E3%81%B6%E4%B8%AD%E5%9B%BD%E8%AA%9E-%E4%B8%AD%E6%96%87%E9%80%9A/id1566085305","_system",'location=no');
  };
});

app.controller('gameCtrl',function(questionsService,$scope){
  var me = this;
  me.items = {};
  me.answer = "";
  me.itemName=myNavigator.getCurrentPage().options.itemName;
  me.json=eval(myNavigator.getCurrentPage().options.json);
  me.youtubeId=myNavigator.getCurrentPage().options.youtubeId;
  window.youtubeId=me.youtubeId;
  window.localStorage.setItem("progress", JSON.stringify(me.items.currentNum));
  var init = function(){
    lSGameData =  JSON.parse(window.localStorage.getItem(me.itemName));
    if(lSGameData==null){
      me.items.currentNum=0;
    }else{
      me.items.currentNum=lSGameData;
    };
    questions = JSON.parse(JSON.stringify(me.json));
    questionInit();
  }

  var questionInit = function(){
    var currentQ = questions[me.items.currentNum];
    var totalQ=questions;
    me.items.totalQ=totalQ;
    me.items.currentQ = currentQ;
    me.items.totalNum = questions.length;
    me.answer = "";
    me.items.currentQ.myAnswer = [];
    me.items.currentQ.status = [];
    window.startTime=me.items.currentQ.startTime;
    window.endTime=me.items.currentQ.endTime;
    if(me.items.currentQ.answer.length*20>window.innerWidth-36){
      document.getElementById('textarea').rows=2;
    }else{
      document.getElementById('textarea').rows=1;
    };
    for (var i = 0; i < currentQ.choices.length; i++) {
      me.items.currentQ.status.push(false);
    };
  };

  var saveData= function(){
    window.localStorage.setItem(me.itemName, JSON.stringify(me.items.currentNum));
  }

  me.showAnswer = function () {
    var answer = "";
    for (var i = 0; i < me.items.currentQ.myAnswer.length; i++) {
      answer += me.items.currentQ.myAnswer[i][1];
    }
    me.answer = answer;
  };

  me.choiceWord = function (index) {
    me.items.currentQ.myAnswer.push([index, me.items.currentQ.choices[index]]);
    me.items.currentQ.status[index]=true;
    me.showAnswer();
    if(me.items.currentQ.myAnswer.length>=me.items.currentQ.choices.length){
      setTimeout(me.getAnswer,50);
    }
  };

  me.getAnswer = function(){
    var flag = document.getElementById('textarea').value ==me.items.currentQ.answer;
    var flagText = "間違い";
    if(flag){
      flagText = "正解";
    }
    ons.notification.alert({
      messageHTML: '<style>p{ text-align: left; margin:0px}</style><p><font size=3 color="#3DD3A9">'+me.items.currentQ.text+'</font></p><p><font size=4 face="Heiti SC">'+me.items.currentQ.answer+'</font></p>',
      title: flagText,
      buttonLabel: '次へ',
      animation: 'default',
      callback: function() {
        if(me.items.currentNum >= me.items.totalNum-1){
          me.endGame();
        }else{
          me.nextQuestion();
        }
      }
    });
  };

  me.endGame=function(){
    ons.notification.alert({
      message: 'これで動画は終了です。',
      title: '動画の終了',
      buttonLabel: '次へ',
      animation: 'default',
      callback: function() {
        myNavigator.pushPage('result.html',{totalQ:me.items.totalQ,startTime:me.items.currentQ.startTime});
        window.localStorage.removeItem(me.itemName);
      }
    });
  }

  me.reset= function () {
    me.answer = "";
    me.items.currentQ.myAnswer = [];
    me.items.currentQ.status = [];
    for (var i = 0; i < currentQ.choices.length; i++) {
      me.items.currentQ.status.push(false);
    }
  };

  me.back = function () {
    var len = me.items.currentQ.myAnswer.length;
    if (len > 0) {
      var index = me.items.currentQ.myAnswer[len-1][0];
      me.items.currentQ.status[index] = false;
      me.items.currentQ.myAnswer.pop();
      me.showAnswer();
    }
  };

  me.dictionary=function(){
    myNavigator.pushPage('dictionary.html',{choices:me.items.currentQ.choices,animation:"lift"});
  };

  me.backQuestion=function(){
    if(me.items.currentNum >=1){
      me.items.currentNum--;
      saveData();
      $scope.$apply(questionInit);
      $scope.$apply(init);
      repeatVideo();
    }
  }

  me.play=function(){
   playVideo();
  };
  
  me.nextQuestion=function(){
    if(me.items.currentNum+1 <me.items.totalNum){
      me.items.currentNum++;
      saveData();
      $scope.$apply(questionInit);
      $scope.$apply(init);
      repeatVideo();
    }
    else{
      me.endGame();
    }
  }
  
  me.backTop = function(){
    saveData();
    setTimeout("location.reload(false)",300);
    myNavigator.pushPage('top.html', {currentNum:me.items.currentNum,totalNum:me.items.totalNum,animation: "none"});
  };
  init();
});

app.controller('dictionaryCtrl',function(){
  this.choices = myNavigator.getCurrentPage().options.choices;
  this.URLClick=function(index){
    document.getElementById("iframe").src="https://cjjc.weblio.jp/content/"+this.choices[index];
  };
  this.openWeblio=function(index){
    cordova.InAppBrowser.open(document.getElementById("iframe").src,"_system",'location=no');
  }
});

app.controller('resultCtrl',function(){
  this.currentTime=Math.floor(Number(this.start));
  this.totalQ= myNavigator.getCurrentPage().options.totalQ;
  this.start=myNavigator.getCurrentPage().options.totalQ[1].startTime;
  document.getElementById("fullVideo").src="https://www.youtube.com/embed/"+youtubeId+"?start="+this.start+"&showinfo=1&rel=0&playsinline=1";
  this.backTop = function(){
    setTimeout("location.reload(false)",300);
    myNavigator.pushPage('top.html');
  };
});
