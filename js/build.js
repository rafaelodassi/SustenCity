(function(){
	var build = {
		builderItemsUl: $(".builderItems .swiper-wrapper"),
		jsonTile: {},
        mySwiper: undefined,
		
		createItems: function (className, callback) {
			var self = this,
				key,
				dragMode,
                bg,
                swiperSlide,
				_json;

			if (self.builderItemsUl.children().length > 0)
				self.builderItemsUl.empty();
			
			$.getJSON( "./js/builditems.json", function( json ) {
				_json = json[className];								

				for (key in _json) {
					self.jsonTile[key] = _json[key];
					dragMode = _json[key].dragMode;

                    bg = $("<div/>");
                    bg.addClass("bg");
                    bg.css({
                        'width': dragMode.bgWidth + "px",
                        'height': dragMode.bgHeight + "px",
                        'background': 'url('+ dragMode.bgImg +')',
                        'backgroundPosition': dragMode.bgPositionX + "px " + dragMode.bgPositionY + "px"
                    });

                    swiperSlide = $("<div/>");
                    swiperSlide.attr("id", key);
                    swiperSlide.addClass("swiper-slide");
                    swiperSlide.append(bg);

					self.builderItemsUl.append(swiperSlide);
				}

                /*resetando o slider criado anteriormente*/
                if (self.mySwiper != undefined) {
                    self.mySwiper.destroy(true, true);
                    self.mySwiper = undefined;
                }

                /*instanciando um novo slider*/
                self.mySwiper = new Swiper('.swiper-container', {
                    slidesPerView: 'auto',
                    simulateTouch: false
                });

                $('.arrow-left').on('click', function(e){
                    self.mySwiper.swipePrev();
                });

                $('.arrow-right').on('click', function(e){
                    self.mySwiper.swipeNext();
                });

                /*alinhando a base(bottom)*/
                var swiperHeight = self.builderItemsUl.height(),
                	maxHeight = 0;

                $( self.builderItemsUl.find( ".swiper-slide" ) ).each( function (i, element) {
                    if ( $(element).height() > maxHeight )
                        maxHeight = $(element).height();
                });

                self.builderItemsUl.height( maxHeight );

				callback();								
			});			
		},
		
		initialize: function () {
			var self = this,
				builder = $(".builder"),
				builderItemsMenu = builder.find("li"),
				builderItems = $(".builderItems"),
				closeItems = builderItems.find(".close"),
				hero = builderItems.find(".hero"),				
				tileMap = canvas.getChildByName('tileMap'),
				overlay = $("#overlay"),				
				buildHighlight = null,
				highlightCss = {},
				buildButtons = null,
				buildButtonsOff = false,
				fnMouseMove = null,
				fnMouseUp = null,
				fnMouseDown  = null,
				fnCancel = null,
				fnAccept = null,
				fnAdd = null,
				fnRotate = null,
				engineBuild = null,
				tileObj = null,
				buildOk = false,
				currentItemObj,
				currentDrag,
				currentStatus,
				currentId,				
				countAdd = 1,
				currentMode,
				bubble = builderItems.find(".bubble"),
				highlightOffset = {},
				buttonsOffset = {},
                rewardBubble = undefined,
                tileMain = undefined,
				bubbleHide = false;

			builderItemsMenu.click(function () {
                gavia.addLoop("animateTileMapRows", {
                	target: canvas.getChildByName('tileMapRows'),
                    duration: 0.5,
                    properties: {
                    	alpha: 0.3
                    }
                });

				builder.addClass('move');
                bubble.removeClass('msg');
				hero.removeClass('msg').addClass('move');
				builderItems.addClass('move');

				//constroi os items referentes a opcao selecionada do menu
				self.createItems(this.className, function () {					
					bubble.html('<label>Vamos construir?</label><div class="pointer"></div>');
					bubble.addClass('move');

					self.builderItemsUl.find(".swiper-slide").hover(function () {
						currentId = this.id;

						var coins = self.jsonTile[currentId].status.drops || self.jsonTile[currentId].status.lotus,
                            typeCoin = (self.jsonTile[currentId].status.drops != undefined) ? "gotas" : "flor de lótus",
							labelItem = self.jsonTile[currentId].dragMode.label;

						var text = '<label>' + labelItem + ' / Preço: ' + coins + ' ' + typeCoin + '</label>';
						bubble.html(text + '<div class="pointer"></div>');

						if (!bubbleHide) bubble.addClass('move');
						else bubbleHide = false;
					});

					self.builderItemsUl.find(".swiper-slide").mousedown(function () {
						currentId = this.id;

                        var coins = self.jsonTile[currentId].status.drops || self.jsonTile[currentId].status.lotus,
                            typeCoin = (self.jsonTile[currentId].status.drops != undefined) ? "gotas" : "flor de lótus",
                            currentCoin = (typeCoin == "gotas") ? "drops" : "lotus";

						if ( state[currentCoin] < coins ) {
							var text = '<label>Você não tem ' + typeCoin + ' suficientes, que pena!</label>';
							bubble.html(text + '<div class="pointer"></div>');								
						}
						else {
							bubbleHide = true;
							engineBuild(this.id, 'add');
						}
					});
				});
			});
			
			engineBuild = function (id, mode) {
				currentItemObj = self.jsonTile[id].tileMode;
				currentDrag = self.jsonTile[id].dragMode;
				currentStatus = self.jsonTile[id].status;
				countAdd = 1;				
				currentMode = mode;				

				var	coord,
					objWidth = currentItemObj.tileWidth,
					objHeight = currentItemObj.tileHeight,							
					tilesX = currentItemObj.tilesX,
					tilesY = currentItemObj.tilesY,							
					tileWidth = tileMap.tileWidth,
					tileHeight = tileMap.tileHeight,
					calcTopObj = 0,
					tileSelected,
					tileSelectedCol,
					buildNot = true,
					rotate = false,
					fnMove = null;

				overlay.append("<div class='buildHighlight'></div>");
				buildHighlight = $(".buildHighlight");
				
				highlightCss = {
					'width': objWidth + "px",
					'height': objHeight + "px",
					'background': 'url(./images/tiles/' + currentItemObj.tileImg + '.png)',
					'backgroundPosition': parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + objHeight)) + "px",
					'opacity': mode === 'edit' ? 1 : 0
				};

				buildHighlight.css(highlightCss);

				overlay.append("<div class='buildButtons'></div>");
				buildButtons = $(".buildButtons");
				
				if (id == 'rua') {
					buildButtons.append("<div class='buttonsRua'><div class='add'></div><div class='rotate'></div></div>");
					
					var buttonsRua = $(".buttonsRua");								
					buttonsRua.css("left", -objWidth + "px");
					buttonsRua.find(".add").bind('click', fnAdd);
					buttonsRua.find(".rotate").bind('click', fnRotate);
				}

				if ( mode === 'add' ) {
					buildButtons.append("<div class='buttonsGeral'><div class='accept'></div><div class='cancel'></div></div>");
					
					var buttonsGeral = $(".buttonsGeral");
					buttonsGeral.css("left", objWidth + 5 + "px");
					buttonsGeral.find(".accept").bind('click', fnAccept);
					buttonsGeral.find(".cancel").bind('click', fnCancel);
				}
				else if ( mode === 'edit' ) {
					buildButtons.append("<div class='buttonsGeral'><div class='accept'></div><div class='sell'></div></div>");
					
					var buttonsGeral = $(".buttonsGeral");
					buttonsGeral.css({"left": objWidth + 5 + "px", "width": "85px"});
					buttonsGeral.find(".accept").bind('click', fnAccept);
					buttonsGeral.find(".sell").bind('click', fnCancel);
				}

				buildOk = (mode === 'edit') ? true : false;
				calcTopObj = ( (objHeight - tileHeight) - ((tileHeight / 2) * (tilesY - 1)) );												

				fnMove = function () {
					if (buildOk) {
						tileObj = gavia.getTile(tileMap, event);

						coord = gavia.getTileClient(tileMap, tileObj.row, tileObj.col) || {
                            x: (event.clientX - (objWidth/2)) - tileMap.x,
                            y: event.clientY - tileMap.y
                        };

						tileSelected = tileObj.row-(currentItemObj.tilesX-1);
						tileSelectedCol = tileObj.col-(currentItemObj.tilesY-1);
						buildNot = true;
						rotate = buildButtons.find(".rotate").hasClass('active');

						for (var i=tileSelected; i<=tileObj.row; i++) {
							for (var n=tileObj.col; n<tileObj.col+currentItemObj.tilesY; n++) {								
								if (typeof tileMap.map[i] == 'undefined' || typeof tileMap.map[i][n] == 'undefined' || typeof tileMap.map[i][n] == 'object')
									buildNot = false;
							}
						}

						if (countAdd > 1) {
							if (rotate == true)
								buildNot = tileSelectedCol + (countAdd-1) > tileMap.map[0].length-1 ? false : true;
							else
								buildNot = tileSelected - (countAdd-1) < 0 ? false : true;
						}

						if (!buildNot || !tileObj) {
							if (!buildButtonsOff) {
								buildButtonsOff = true;
								buildButtons.stop().animate({opacity: 0}, 150, function () {
									$(this).hide();
								});

								if ( rotate === true ) {
                                    var posBg = {
                                        x: -(currentItemObj.tilePositionX + currentItemObj.tileWidth),
                                        y: -(currentItemObj.tilePositionY + (objHeight * 2))
                                    };

                                    buildHighlight.css(
                                        "backgroundPosition",
                                        parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                                    );

                                    if ( countAdd > 1 ) {
                                        buildHighlight.children().css(
                                            "backgroundPosition",
                                            parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                                        );
                                    }
                                }
                                else {
                                    buildHighlight.css(
                                        "backgroundPosition",
                                        parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (objHeight * 2))) + "px"
                                    );

                                    if ( countAdd > 1 ) {
                                        buildHighlight.children().css(
                                            "backgroundPosition",
                                            parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (objHeight * 2))) + "px"
                                        );
                                    }
                                }
							}
						}
						else {
							if (buildButtonsOff) {
								buildButtonsOff = false;
								buildButtons.show();
								buildButtons.stop().animate({opacity: 1}, 150);
								
								if ( rotate === true ) {
                                    buildHighlight.css(
                                        "backgroundPosition",
                                        parseInt(-(currentItemObj.tilePositionX + currentItemObj.tileWidth)) + "px " + parseInt(-(currentItemObj.tilePositionY + objHeight)) + "px"
                                    );

                                    if ( countAdd > 1 ) {
                                        buildHighlight.children().css(
                                            "backgroundPosition",
                                            parseInt(-(currentItemObj.tilePositionX + currentItemObj.tileWidth)) + "px " + parseInt(-(currentItemObj.tilePositionY + objHeight)) + "px"
                                        );
                                    }
                                }
								else {
                                    buildHighlight.css(
                                        "backgroundPosition",
                                        parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + objHeight)) + "px"
                                    );

                                    if ( countAdd > 1 ) {
                                        buildHighlight.children().css(
                                            "backgroundPosition",
                                            parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + objHeight)) + "px"
                                        );
                                    }
                                }
							}
						}

                        /* drag botoes e highlight */
						buildHighlight.offset({ top: (coord.y + tileMap.y) - calcTopObj, left: (coord.x + tileMap.x) - ((objWidth-(tileWidth*tilesX))/2) });
						buildButtons.offset({ top: (coord.y + tileMap.y), left: (coord.x + tileMap.x) });

						highlightOffset = buildHighlight.offset();
						buttonsOffset = buildButtons.offset();

						if ( rewardBubble ) {
                            rewardBubble.update({
								x: parseInt((coord.x + currentItemObj.tileWidth/2 - rewardBubble.width/2)),
								y: parseInt((coord.y - currentItemObj.tileHeight/2 - rewardBubble.height))
							});
						}
					}
				}

				fnMouseMove = function (event) {
					fnMove();
				}
	
				fnMouseDown = function () {					
					document.addEventListener('mousemove', fnMouseMove);
					document.addEventListener('mouseup', fnMouseUp);
				}
				
				fnMouseUp = function (event) {
					if (buildOk == false) {
						tileMap.removeOver();
					}
					else {
						buildHighlight[0].addEventListener('mousedown', fnMouseDown);
					}

					document.removeEventListener('mousemove', fnMouseMove);
					document.removeEventListener('mouseup', fnMouseUp);
				}

				if ( mode === 'edit' ) {
					buildButtons.stop().animate({opacity: 1}, 300);
					canvas.scroll(false);
				}
				else {
                    rewardBubble = undefined;
                    
                    builderItems.removeClass('move');
                    hero.removeClass('move');
                    bubble.removeClass('move');

                    buildHighlight.stop().animate({opacity: 1}, 300);
                    buildButtons.stop().animate({opacity: 1}, 300);

                    buildOk = true;
                    canvas.scroll(false);
				}

				fnMove();

				document.addEventListener('mousemove', fnMouseMove);
				document.addEventListener('mouseup', fnMouseUp);
			}

			fnAdd = function () {		
				highlightCss.opacity = 1;

				var rotate = buildButtons.find(".rotate").hasClass('active'),
					buildNot = true;

				if ( rotate ) {					
					highlightCss.backgroundPosition = parseInt(-(currentItemObj.tilePositionX + currentItemObj.tileWidth)) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px";

					var clone = $('<div/>')
						.addClass('buildHighlight')
						.css(highlightCss)
						.offset({ top: 16 * countAdd, left: 32 * countAdd });
				}
				else {
					highlightCss.backgroundPosition = parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px";

					var clone = $('<div/>')
						.addClass('buildHighlight')
						.css(highlightCss)
						.offset({ top: -16 * countAdd, left: 32 * countAdd });
				}

				buildHighlight.append(clone);

				countAdd++;

				var tileSelected = tileObj.row-(currentItemObj.tilesX-1);
				var tileSelectedCol = tileObj.col-(currentItemObj.tilesY-1);

				if (rotate == true)
					buildNot = tileSelectedCol + (countAdd-1) > tileMap.map[0].length-1 ? false : true;				
				else
					buildNot = tileSelected - (countAdd-1) < 0 ? false : true;

				if (!buildNot) {					
					buildButtons.stop().animate({opacity: 0}, 150, function () {
						$(this).hide();
					});

					if ( rotate === true ) {
                        var posBg = {
                            x: -(currentItemObj.tilePositionX + currentItemObj.tileWidth),
                            y: -(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))
                        };

                        buildHighlight.css(
                            "backgroundPosition",
                            parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                        );

                        if ( countAdd > 1 ) {
                            buildHighlight.children().css(
                                "backgroundPosition",
                                parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                            );
                        }
                    }
                    else {
                        buildHighlight.css(
                            "backgroundPosition",
                            parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))) + "px"
                        );

                        if ( countAdd > 1 ) {
                            buildHighlight.children().css(
                                "backgroundPosition",
                                parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))) + "px"
                            );
                        }
                    }
				}
			}
			
			fnRotate = function () {
				var buildNot = true,
					tileSelected = tileObj.row-(currentItemObj.tilesX-1),
					tileSelectedCol = tileObj.col-(currentItemObj.tilesY-1);

				if ( $(this).hasClass('active') ) {
					buildHighlight.css("backgroundPosition", parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px");

					$.each(buildHighlight.children(), function (key, value) {
						$(value).css({
							"backgroundPosition": parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px",
							"top": -16 * (key+1) + "px",
							"left": 32 * (key+1) + "px"
						});
					});

					$(this).removeClass('active');

					buildNot = tileSelected - (countAdd-1) < 0 ? false : true;					

					if (!buildNot) {
						buildHighlight.css(
                            "backgroundPosition",
                            parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))) + "px"
                        );

                        if ( countAdd > 1 ) {
                            buildHighlight.children().css(
                                "backgroundPosition",
                                parseInt(-currentItemObj.tilePositionX) + "px " + parseInt(-(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))) + "px"
                            );
                        }
					}
				}
				else {
					buildHighlight.css("backgroundPosition", parseInt(-(currentItemObj.tilePositionX + currentItemObj.tileWidth)) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px");

					$.each(buildHighlight.children(), function (key, value) {
						$(value).css({							
							"backgroundPosition": parseInt(-(currentItemObj.tilePositionX + currentItemObj.tileWidth)) + "px " + parseInt(-(currentItemObj.tilePositionY + currentItemObj.tileHeight)) + "px",
							"top": 16 * (key+1) + "px",
							"left": 32 * (key+1) + "px"
						});
					});

					$(this).addClass('active');

					buildNot = tileSelectedCol + (countAdd-1) > tileMap.map[0].length-1 ? false : true;

					if (!buildNot) {
						var posBg = {
                            x: -(currentItemObj.tilePositionX + currentItemObj.tileWidth),
                            y: -(currentItemObj.tilePositionY + (currentItemObj.tileHeight * 2))
                        };

                        buildHighlight.css(
                            "backgroundPosition",
                            parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                        );

                        if ( countAdd > 1 ) {
                            buildHighlight.children().css(
                                "backgroundPosition",
                                parseInt(posBg.x) + "px " + parseInt(posBg.y) + "px"
                            );
                        }
					}					
				}

				if (!buildNot) {
					buildButtons.stop().animate({opacity: 0}, 150, function () {
						$(this).hide();
					});
				}
			}
			
			fnAccept = function () {
				var rotate = buildButtons.find(".rotate").hasClass('active'),
					objTileAux = { id: currentId, type: 'aux', tileMain: { row: tileObj.row, col: tileObj.col } };
				
				var objTile = {
					id: currentId,
					tileImg: currentItemObj.tileImg,
					sx: ( rotate === true ) ? currentItemObj.sx + currentItemObj.tileWidth : currentItemObj.sx,
					sy: currentItemObj.sy,
					tileWidth: currentItemObj.tileWidth,
					tileHeight: currentItemObj.tileHeight,
					tilesX: currentItemObj.tilesX,
					tilesY: currentItemObj.tilesY,
					type: 'draw',
					tileMain: { row: tileObj.row, col: tileObj.col },
					trashTime: currentStatus.trashTime ? currentStatus.trashTime : undefined 
				};													
				
				var tileSelected = tileObj.row-(currentItemObj.tilesX-1);								
				
				for (var i=tileSelected; i<=tileObj.row; i++) {
					for (var n=tileObj.col; n<tileObj.col+currentItemObj.tilesY; n++) {
						tileMap.map[i][n] = objTileAux;
					}
				}

				if ( rotate === true ) {
					for (var i=tileObj.col; i<=tileObj.col+(countAdd-1); i++) {
						tileMap.map[tileObj.row][i] = objTile;
					}
				}
				else {
					for (var i=tileObj.row; i>=tileObj.row-(countAdd-1); i--) {
						tileMap.map[i][tileObj.col] = objTile;
					}
				}

                /*caso for uma construcao nova*/
				if (currentMode == 'add') {
                    /*subtrai as gotas de acordo com o valor do item a ser construido*/
                    if (currentStatus.drops != undefined)
                        state.removeDrops(currentStatus.drops * countAdd);
                    else
                        state.removeLotus(currentStatus.lotus);

                    /*mensagem didatica no balao do personagem*/
                    if (currentStatus.smallBubble) {
                        hero.addClass('msg');
                        bubble.addClass('msg');
                        bubble.html(currentStatus.smallBubble);

                        bubble.find(".ja-sei").click(function () {
                            hero.removeClass('msg');
                            bubble.removeClass('msg');
                        });

                        if (currentStatus.largeBubble) {
                            bubble.find(".saber-mais").click(function () {
                                hero.removeClass('msg');
                                bubble.removeClass('msg');

                                var intro = $("#intro");
                                intro.find(".scroll").html(currentStatus.largeBubble);
                                intro.find("button").html("Fechar e voltar para SustenCity");
                                intro.show().fadeTo( 300, 1 );
                            });
                        }
                    }
                }
                else if (currentMode == 'edit' && countAdd > 1)
                	state.removeDrops(currentStatus.drops * (countAdd-1));                

                /*adiciona a recompensa de acordo com o tempo do item*/
				if ( currentStatus.rewardType ) {
                    var type = currentStatus.rewardType;
					var coords = gavia.getTileClient(tileMap, tileObj.row, tileObj.col);
											
					if ( currentMode == 'add' ) {
                        rewardBubble = canvas.addChild(tileObj.row + '_' + tileObj.col + '_' + type, _imgLoaded[type + "Bubble"]);

                        rewardBubble.update({
							alpha: 0,
							extra: { rewardValue: currentStatus.rewardValue, rewardTime: currentStatus.rewardTime, startTime: gavia.loopTimestamp },
							x: parseInt(coords.x + currentItemObj.tileWidth/2 - rewardBubble.width/2),
							y: parseInt(coords.y - currentItemObj.tileHeight/2 - rewardBubble.height)
						});
					}
					else if ( currentMode == 'edit' )
                        rewardBubble = canvas.getChildByName(tileMain.row + '_' + tileMain.col + '_' + type).update({
							name: tileObj.row + '_' + tileObj.col + '_' + type
						});
				}

				fnCancel();
			}			

			/*metodo que cancela a acao de construir*/
			fnCancel = function (e) {
				gavia.addLoop("animateTileMapRows", {
					target: canvas.getChildByName('tileMapRows'),                    
                    duration: 0.3,
                    properties: {
                    	alpha: 0
                    }
                });                

				/*remove as animacoes em css, retorna os elementos em suas posicoes originais*/
				builder.removeClass('move');
				hero.removeClass('move');
				bubble.removeClass('move');
				builderItems.removeClass('move');				

				/*remove o balao de fala do personagem*/
				if ( bubble.hasClass('opacity') ) bubble.removeClass('opacity');

				/*if que evita elementos nulos*/
				if (buildHighlight && buildButtons) {
					buildHighlight[0].removeEventListener('mousedown', fnMouseDown);
					
					buildHighlight.stop().animate({opacity: 0}, 300, function () {
						$(this).remove();
					});

					buildButtons.find(".add").unbind('click', fnAdd);
					buildButtons.find(".rotate").unbind('click', fnRotate);
					buildButtons.find(".accept").unbind('click', fnAccept);
					
					if ( currentMode == 'edit' ) {
						/*caso ocorra a venda do item*/
						if (e) {
                            if (currentStatus.drops != undefined)
                                state.addDrops(currentStatus.drops/2);
                            else
                                state.addLotus(1);

							canvas.removeChild(tileMain.row + '_' + tileMain.col + '_' + currentStatus.rewardType);
						}					

						buildButtons.find(".sell").unbind('click', fnCancel);						
					}
					else if ( currentMode == 'add' )
						buildButtons.find(".cancel").unbind('click', fnCancel);

					buildButtons.stop().animate({opacity: 0}, 300, function () {
						$(this).remove();
					});
				}

				canvas.scroll(true, canvas.getChildByName("bg"));
			}

			closeItems.click(function () {
                fnCancel();
			});		

			tileMap.addMouseDown(function (data) {	
				if (data.inMap) {				
					var objData = data.target.map[data.row][data.col],
						dataId = objData.id,
                        selectedById = self.jsonTile[dataId];

					if ( !builder.hasClass("move") && dataId !== undefined ) {
						var _currentItemObj = selectedById.tileMode;
						tileMain = (_currentItemObj.tilesX == 1 && _currentItemObj.tilesY == 1) ? { row: data.row, col: data.col } : objData.tileMain;
						var tileSelected = tileMain.row-(_currentItemObj.tilesX-1);												

						currentId = dataId;

						for (var i=tileSelected; i<=tileMain.row; i++) {
							for (var n=tileMain.col; n<tileMain.col+_currentItemObj.tilesY; n++) {
								tileMap.map[i][n] = 0;
							}
						}

                        rewardBubble = canvas.getChildByName(tileMain.row + '_' + tileMain.col + '_' + selectedById.status.rewardType);

						engineBuild(dataId, 'edit');

						gavia.addLoop("animateTileMapRows", {
							target: canvas.getChildByName('tileMapRows'),		                    
		                    duration: 0.5,
		                    properties: {
		                    	alpha: 0.3
		                    }
		                });

		                builder.addClass('move');
					}
				}
			});
		}
	};

	window.build = build;
})();