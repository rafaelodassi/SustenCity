(function(){
	var gavia = function (selector) {
		return new gavia.fn.init( selector );
	}

	//Metodos prototypes do objeto global gavia
	gavia.fn = gavia.prototype = {
		preloadImages: function (objImg, objFn) {
			var size = gavia.objLength(objImg),
				sizeCopy = gavia.objLength(objImg),
				count = 0,
				self = this;

			for ( var index in objImg ) {
				var img = new Image();
				img.src = objImg[index];

				img.onload = function () {
					sizeCopy--;

					var percent = parseInt(((size - sizeCopy) * 100)/size);

					if (objFn['progress']) objFn['progress']( percent );

					count++;

					if ( count == size ) {
						if (objFn['completed']) objFn['completed']( objImg );
					}
				};

				objImg[index] = img;
			}

			gavia.fn.tilesImg = objImg;

			return this;
		},

		addChild: function (name, child, index) {
			if ( child.constructor == Array ) {
				this.childrens[name] = new map(name, child, this.selector, index);
			}
			else {
				this.childrens[name] = new image(name, child, index);
			}

			gavia.fn.selector = this.selector;
			
			return this.childrens[name];
		},

		removeChild: function (name) {
			if ( this.childrens.hasOwnProperty(name) )
				delete this.childrens[name];

			return this;
		},

		getChildByName: function (name) {
			if ( !this.childrens.hasOwnProperty(name) ) {
				return undefined;
			}

			gavia.fn.selector = this.selector;
			return this.childrens[name];
		},

		createStage: function (obj) {
			var canvas = this.selector;

			if ( typeof obj.screen === 'object' ) {
				canvas.width = obj.screen.width;
	        	canvas.height = obj.screen.height;
	        }
	        else if ( typeof obj.screen === 'string' && obj.screen == 'fullscreen' ) {
	        	canvas.width = window.innerWidth;
        		canvas.height = window.innerHeight;
	        }

	        gavia.fn.childrens = {};
	        gavia.fn.translate = { x: 0, y:0 };
	        gavia.fn.width = canvas.width;
	        gavia.fn.height = canvas.height;

			return this;
		},

        updateStage: function () {
            var canvas = this.selector;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            gavia.fn.width = canvas.width;
            gavia.fn.height = canvas.height;

            return this;
        },

		draw: function () {
			var canvas = this.selector,
				ctx = canvas.getContext("2d"),
				childrens = this.childrens,
				translateCanvas = this.translate;

			ctx.clearRect (0, 0, canvas.width, canvas.height);

		    for (var key in childrens) {
		    	if ( childrens[key].type == 'image' ) {
			        var position = { x: childrens[key].x, y: childrens[key].y },
			        	scale = { x: childrens[key].scaleX, y: childrens[key].scaleY },
			        	image = childrens[key].image,
			        	alpha = childrens[key].alpha,
			        	size = { width: childrens[key].width, height: childrens[key].height };
			        	
			        ctx.save();

                    if ( childrens[key].contextScroll == false )
					    ctx.translate( position.x, position.y );
                    else
                        ctx.translate( Math.round(position.x + translateCanvas.x), Math.round(position.y + translateCanvas.y) );

					ctx.scale( scale.x, scale.y );
					ctx.globalAlpha = alpha;
	                ctx.drawImage(
	                	image,
	                	0,
	                	0,
	                	size.width,
	                	size.height,
	                	0,
	                	0,
	                	size.width,
	                	size.height
	                );
	                ctx.restore();
	            }
	            else if ( childrens[key].type == 'map' ) {
					var	self = childrens[key],
						mapKey,
						selfChildrens = self.childrens,
						objImg = this.tilesImg,
						map = self.map,
						position = { x: self.x, y: self.y },
			        	scale = { x: self.scaleX, y: self.scaleY },
						sizeTile = self.sizeTile,
				        sizeDraw = self.sizeDraw,
				        alpha = self.alpha;			       	

				    self.x = translateCanvas.x;
				    self.y = translateCanvas.y;

					ctx.save();
					ctx.translate( translateCanvas.x, translateCanvas.y );
					ctx.scale( scale.x, scale.y );
					ctx.globalAlpha = alpha;							

					var row = map.length;
					var col = map[0].length;

				    for (var line=1; line<=(row + col -1); line++) {		        
			        	var start_col =  Math.max(0, line-row);
		         		var count = Math.min(line, (col-start_col), row);
				 		        
				        for (var j=0; j<count; j++) {
				        	var x = Math.min(row, line)-j-1;
				        	var y = start_col+j;
				        	var coords = map[y][x];

							var tilePositionX = (x - y) * (sizeTile.width / 2);
							tilePositionX += (canvas.width / 2) - (sizeTile.width / 2);

							var tilePositionY = (x + y) * (sizeTile.height / 2);
							tilePositionY += (canvas.height / 2) - (sizeDraw.height / 2);
																												
							if ( typeof coords == 'object' ) {								
								if ( coords.type == 'draw' ) {									
									ctx.drawImage(
										objImg[coords.tileImg],
										coords.sx,
										coords.sy,
										coords.tileWidth,
										coords.tileHeight,
										Math.round( tilePositionX - ((coords.tileWidth - (sizeTile.width * coords.tilesX)) / 2) ),
										Math.round( (tilePositionY - (coords.tileHeight - sizeTile.height)) + ((sizeTile.height / 2) * (coords.tilesY - 1)) ),
										coords.tileWidth,
										coords.tileHeight
									);
								}
							}
							else {
								if ( coords > 0 ) {									
									var img = objImg[coords];

									ctx.drawImage(
										img,
										0,
										0,
										img.width,
										img.height,
										Math.round(tilePositionX),
										Math.round(tilePositionY - (img.height - sizeTile.height)),
										img.width,
										img.height
									);
								}
							}				        	
			            }
				    }

					ctx.restore();
	            }	            
		    }

			return this;
		},

		scroll: function (flag, context) {
			var canvas = this.selector,
				self = this,
				translateCanvas = this.translate,
				startDragOffsetCanvas = {},
        		mouseDown = false;

        	(flag === true) ? $(canvas).bind('mousedown', mouseEvent) : $(canvas).unbind('mousedown');
        	(flag === true) ? $(canvas).bind('mouseup', mouseEvent) : $(canvas).unbind('mouseup');
        	(flag === true) ? $(canvas).bind('mouseover', mouseEvent) : $(canvas).unbind('mouseover');
        	(flag === true) ? $(canvas).bind('mouseout', mouseEvent) : $(canvas).unbind('mouseout');
        	(flag === true) ? $(canvas).bind('mousemove', mouseEvent) : $(canvas).unbind('mousemove');

			function mouseEvent (event)  {				
				if ( event.type == 'mouseup' ) {
					mouseDown = false;									
				}
				else if ( event.type == 'mouseover' || event.type == 'mouseout' ) {
					mouseDown = false;					
				}
				else if ( event.type == 'mousedown' ) {
					mouseDown = true;

			        startDragOffsetCanvas.x = event.clientX - translateCanvas.x;
			        startDragOffsetCanvas.y = event.clientY - translateCanvas.y;
				}
				else if ( event.type == 'mousemove' ) {
					if( mouseDown ) {														                       
                        translateCanvas.x = event.clientX - startDragOffsetCanvas.x;
                        translateCanvas.y = event.clientY - startDragOffsetCanvas.y;

                        if ( context.width > canvas.width ) {
                            if (Math.abs(translateCanvas.x) >= ((context.width - canvas.width) / 2)) {
                                translateCanvas.x = (translateCanvas.x > 0) ? ((context.width - canvas.width) / 2) : -((context.width - canvas.width) / 2);
                                startDragOffsetCanvas.x = event.clientX - translateCanvas.x;
                            }

                            if (Math.abs(translateCanvas.y) >= ((context.height - canvas.height) / 2)) {
                                translateCanvas.y = (translateCanvas.y > 0) ? ((context.height - canvas.height) / 2) : -((context.height - canvas.height) / 2);
                                startDragOffsetCanvas.y = event.clientY - translateCanvas.y;
                            }
                        }
		        	}
				}				
			}
		},

		addClick: function (fn) {
			var canvas = this.selector;
			gavia.fn.clickFn = fn;
			canvas.addEventListener("click", fn, false);

			return this;
		},

		removeClick: function () {
			var canvas = this.selector;
			canvas.removeEventListener("click", this.clickFn, false);

			return this;
		},

		addMouseUp: function (fn) {
			var canvas = this.selector;
			gavia.fn.mouseupFn = fn;
			canvas.addEventListener("mouseup", fn);

			return this;
		},

		addMouseMove: function (fn) {
			var canvas = this.selector;
			gavia.fn.mousemoveFn = fn;
			canvas.addEventListener("mousemove", fn);

			return this;
		}	
	}

	/*IMAGE*/
	//Propriedades fixas do objeto image
	var image = function (name, child, index) {
		this.type = 'image';
		this.name = name;
		this.image = child;
		this.x = 0;
		this.y = 0;
		this.scaleX = 1;
		this.scaleY =  1;
		this.alpha = 1;
		this.width = child.width;
		this.height = child.height;
		this.extra = {};
		this.fnMouseDown = null;
        this.contextScroll = true;
	}

	//Metodos prototypes do objeto image
	image.fn = image.prototype = {
		update: function (obj) {
			var self = this,
				key;

			for (key in obj) {		
				if ( key == 'name' && obj[key] != self.name ) {
					gavia.fn.childrens[ obj[key] ] = this;
					delete gavia.fn.childrens[ self.name ];					
				}

				self[key] = obj[key];
			}

			return self;
		},
		addMouseDown: function (fn) {
			var self = this,
				canvas = gavia.fn.selector,
				translate = gavia.fn.translate;		

			var mouseEvent = function (event) {				
				if (event.clientX > (self.x + translate.x) &&
					event.clientX < (self.x + translate.x) + self.width &&
					event.clientY > (self.y + translate.y) &&
					event.clientY < (self.y + translate.y) + self.height) {
					fn(self, event);
					self.removeMouseDown();
				}			
			};

			self.fnMouseDown = mouseEvent;
			canvas.addEventListener('mousedown', mouseEvent);

			return self;
		},
		removeMouseDown: function () {
			var self = this,
				canvas = gavia.fn.selector;

			canvas.removeEventListener('mousedown', self.fnMouseDown);
		}
	}

	/*MAP*/
	//Propriedades fixas do objeto map
	var map = function (name, child, canvas, index) {
		this.type = 'map';
		this.name = name;
		this.map = child;
		this.canvas = canvas;
		this.x = 0;
		this.y = 0;
		this.scaleX = 1;
		this.scaleY = 1;
		this.tileWidth = 64;
		this.tileHeight = 32;
		this.alpha = 1;
		this.sizeTile = {
			width: this.tileWidth,
			height: this.tileHeight
		};
        this.sizeDraw = {
        	width: this.map[0].length * this.sizeTile.width,
        	height: this.map.length * this.sizeTile.height
        };
        this.fnMouseMove = null;
        this.fnMouseOver = null;
        this.fnMouseDown = null;
        this.childrens = {};
	}

	//Metodos prototypes do objeto map
	map.fn = map.prototype = {
		addMouseMove: function (fn) {
			var self = this,
				canvas = self.canvas,
				map = self.map,
				obj = null,
		        data = { target: self, row: null, col: null, clientX: null, clientY: null, status: null };

			var mouseEvent = function (event) {
				obj = gavia.getTile(self, event);

				data.row = obj.row;
				data.col = obj.col;
				data.clientX = event.clientX;
				data.clientY = event.clientY;
				data.status = obj === false ? false : true;

				fn(data);
			};

			self.fnMouseMove = mouseEvent;
			canvas.addEventListener('mousemove', mouseEvent);

			return this;
		},

		removeMouseMove: function () {
			var self = this,
				canvas = self.canvas;

			canvas.removeEventListener('mousemove', self.fnMouseMove);
		},

		addOver: function (fn) {
			var self = this,
				canvas = self.canvas,
				obj = null,
		        data = { target: self, row: null, col: null, inMap: null };

			var mouseEvent = function (event) {
				obj = gavia.getTile(self, event);

				data.row = obj.row;
				data.col = obj.col;
				data.inMap = obj === false ? false : true;

				fn(data);
			};

			self.fnMouseOver = mouseEvent;
			canvas.addEventListener('mouseover', mouseEvent);

			return this;
		},

		removeOver: function () {
			var self = this,
				canvas = self.canvas;

			canvas.removeEventListener('mouseover', self.fnMouseOver);
		},

		addMouseDown: function (fn) {
			var self = this,
				canvas = self.canvas,
				obj = null,
		        data = { target: self, row: null, col: null, inMap: null };

			var mouseEvent = function (event) {
				obj = gavia.getTile(self, event);

				data.row = obj.row;
				data.col = obj.col;
				data.inMap = obj === false ? false : true;

				fn(data);
			};

			self.fnMouseDown = mouseEvent;
			canvas.addEventListener('mousedown', mouseEvent);

			return this;
		},

		removeMouseDown: function () {
			var self = this,
				canvas = self.canvas;

			canvas.removeEventListener('mousedown', self.fnMouseDown);
		},

		addTileClick: function (fn) {
			var self = this,
				canvas = self.canvas,
				map = self.map,
				translate = {x: self.x, y: self.y},
				sizeTile = { width: self.tileWidth, height: self.tileHeight },
		        sizeDraw = { width: map[0].length * sizeTile.width, height: map.length * sizeTile.height },
		        tile = { target: this, row: 0, col: 0 };

			var mouseEvent = function (event) {
				var gridOffsetX = 0;
				var gridOffsetY = 0;

				gridOffsetX += (canvas.width / 2) - (sizeTile.width / 2);
				gridOffsetY += (canvas.height / 2) - (sizeDraw.height / 2);

				var row = ( (event.clientY - translate.y) - gridOffsetY ) * 2;
				row = ( (gridOffsetX + row) - event.clientX + translate.x ) / 2;
				var col = ( (event.clientX - translate.x + row ) - sizeTile.height) - gridOffsetX;

				row = Math.round(row / sizeTile.height);
				col = Math.round(col / sizeTile.height);

				tile.row = Math.abs(row);
				tile.col = Math.abs(col);

				if (row >= 0 && col >= 0 && row < map[0].length && col < map.length ) {
					fn(tile);
					gavia.fn.draw();
				}
			};

			self.fnClick = mouseEvent;
			canvas.addEventListener('click', mouseEvent);

			return this;
		},

		removeTileClick: function () {
			var self = this,
				canvas = self.canvas;

			canvas.removeEventListener('click', self.fnClick);
		},

		getChildByName: function (name) {
			return this.childrens[name];
		},

		update: function (obj) {
			var self = this,
				key;

			for (key in obj) {
				self[key] = obj[key];
			}			
		}
	}

	//Tratamento para pseudo metodos do objeto global gavia
	gavia.extend = gavia.fn.extend = function() {
		var options, name, src, copy, target = this;

		if ( arguments[0] != null ) {
			options = arguments[0];

			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				if ( target === copy ) {
					continue;
				}

				if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}

		return target;
	}

	//Pseudo metodos do objeto global gavia
	gavia.extend({
		error: function( msg ) {
			throw new Error( msg );
		},

		objLength: function(obj) {
		    var size = 0, key;

		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }

		    return size;
		},		

		getTile: function (self, event) {
			var canvas = self.canvas,
				map = self.map,
				translate = {x: self.x, y: self.y},
				sizeTile = { width: self.tileWidth, height: self.tileHeight },
		        sizeDraw = { width: map[0].length * sizeTile.width, height: map.length * sizeTile.height },
		        data = { target: self, row: null, col: null },
				gridOffsetX = 0,
				gridOffsetY = 0;

			gridOffsetX += (canvas.width / 2) - (sizeTile.width / 2);
			gridOffsetY += (canvas.height / 2) - (sizeDraw.height / 2);

			var row = ( (event.clientY - translate.y) - gridOffsetY ) * 2;
			row = ( (gridOffsetX + row) - event.clientX + translate.x ) / 2;
			var col = ( (event.clientX - translate.x + row ) - sizeTile.height) - gridOffsetX;

			row = Math.round(row / sizeTile.height);
			col = Math.round(col / sizeTile.height);

			data.row = Math.abs(row);
			data.col = Math.abs(col);
			data.x = event.clientX;
			data.y = event.clientY;

			if (row >= 0 && col >= 0 && row < map[0].length && col < map.length )
				return data;
			else
				return false;
		},

		getTileClient: function (self, x, y) {
			var canvas = self.canvas,
				sizeTile = self.sizeTile,
		        sizeDraw = self.sizeDraw,
		        data = { target: self, x: null, y: null };

			var tilePositionX = (y - x) * (sizeTile.width / 2);
			tilePositionX += (canvas.width / 2) - (sizeTile.width / 2);

			var tilePositionY = (y + x) * (sizeTile.height / 2);
			tilePositionY += (canvas.height / 2) - (sizeDraw.height / 2);

			data.x = tilePositionX;
			data.y = tilePositionY;

            if ( isNaN(tilePositionX) && isNaN(tilePositionY) )
                return false;
            else
			    return data;
		},

		addLoop: function (name, obj) {
            if ( obj.target ) {
                for (var key in obj.properties) {
                    obj.properties[key] = {initial: obj.target[key], final: obj.properties[key]};
                }

                if ( obj.contextScroll == false ) {
                    obj.target.update({ contextScroll: false });
                }
            }

			gavia.loops = gavia.loops || {};
			gavia.loops[name] = obj;
		},

		removeLoop: function (name) {
			if ( gavia.loops && gavia.loops.hasOwnProperty(name) )
				delete gavia.loops[name];
		},

		gameLoop: function (_canvas) {
			var startTime;

		    stats.setMode(0);
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.left = '0px';
			stats.domElement.style.top = '0px';
			stats.domElement.style.zIndex = '1';
			document.body.appendChild( stats.domElement );

			function _gameLoop (timestamp) {
				stats.begin();		
				window.requestAnimationFrame(_gameLoop);

                /*update loop*/				
				for ( var key in gavia.loops ) {
                    var currentLoop = gavia.loops[key];

                    if (!currentLoop["startTime"]) currentLoop["startTime"] = timestamp;
                    var alpha = Math.min((timestamp - currentLoop["startTime"]) / (currentLoop["duration"] * 1000), 1.0);

                    if ( alpha >= 1.0 ) {                                       
                        if ( currentLoop["loop"] ) {
                            currentLoop["startTime"] = timestamp;
                        }
                        else {
                            if ( currentLoop["onComplete"] ) currentLoop["onComplete"]();
                            gavia.removeLoop(key);
                        }
                    }

                    if ( currentLoop["target"] ) {
                        var properties = currentLoop["properties"];

                        for (var keyUpdate in properties) {
                            var calc = (properties[keyUpdate]['final'] * alpha) + (properties[keyUpdate]['initial'] * (1 - alpha));
                            var objUpdate = JSON.parse( '{"' + keyUpdate + '":' + calc + '}' );

                            currentLoop["target"].update(objUpdate);
                        }
                    }
                    else
                		currentLoop["update"]( alpha );
				}

                /*render loop*/
				_canvas.draw();

				gavia.loopTimestamp = parseInt(timestamp/1000);

				stats.end();
			}

            window.requestAnimationFrame(_gameLoop);
		}
	});

	//Prototype do metodo animo gavia para setar o seletor
	var init = gavia.fn.init = function( selector ) {
        var selectorCopy = selector.substr( 1, selector.length );
        var elem = document.getElementById( selectorCopy );

        this.version = "0.0.2";
        this.selector = elem;

		return this;
	}

	init.prototype = gavia.fn;

    window.gavia = gavia = window.gv = gavia;
})();