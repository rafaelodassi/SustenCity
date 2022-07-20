(function(){
	var state = {
		drops: 30000,
		lotus: 0,
		
		initialize: function () {							
			this.addDrops(0);
			this.addLotus(0);
		},

		addLotus: function (value) {			
			this.lotus += value;
			$(".valueLotus .count").html(this.lotus).addClass("addLotus").bind('animationend webkitAnimationEnd', function() {
                $(this).removeClass("addLotus");
            });
		},

        removeLotus: function (value) {
            this.lotus -= value;
            $(".valueLotus .count").html(this.lotus).addClass("removeLotus").bind('animationend webkitAnimationEnd', function() {
                $(this).removeClass("removeLotus");
            });
        },

		addDrops: function (value) {			
			this.drops += value;
			$(".valueDrop .count").html(this.drops).addClass("addDrops").bind('animationend webkitAnimationEnd', function() {
                $(this).removeClass("addDrops");
            });
		},

		removeDrops: function (value) {			
			this.drops -= value;
			$(".valueDrop .count").html(this.drops).addClass("removeDrops").bind('animationend webkitAnimationEnd', function() {
                $(this).removeClass("removeDrops");
            });
		}
	};

	window.state = state;
})();