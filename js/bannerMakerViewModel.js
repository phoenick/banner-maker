
function Slide(bannerSize, interConf){
    var self = this;

    self.canvas = null;
}


function BannerMakerViewModel(){
    var self = this;

    self.bannerSize = {
        width: ko.observable(728), 
        height: ko.observable(280)
    };
    
    //interaction layer configuration - appearance and behaviour of controls
    self.interConf = {  
        transparentCorners: false,
        cornerSize: 10,
        rotatingPointOffset: 25
    };

    self.slide = null;
    self.slidePreview = null;

    var canvas = new fabric.Canvas('canvasp');
    //canvas.set(interConf);
    var rect = new fabric.Rect({
        left: 200,
        top: 100,
        fill: 'red',
        width: 120,
        height: 120,
        angle: 45,
        transparentCorners: false,
        cornerSize: 10,
        rotatingPointOffset: 25
    });
    var rect2 = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'green',
        width: 120,
        height: 120,
        angle: 45,
        transparentCorners: false,
        cornerSize: 10,
        rotatingPointOffset: 25
    });
    canvas.add(rect);
    canvas.add(rect2);
    rect.setCoords();

    canvas.on('mouse:down', function(e) { });
    canvas.on('mouse:up', function(e) { console.log("mouse up");});
    canvas.on('object:moving', function(e) { console.log("object:moving");});
    canvas.on('object:selected', function(e) {
        e.target.bringToFront();
    });
    

    
    // var filter = new fabric.Image.filters.Resize();
    // filter.applyTo(canvas, 0.5, 0.5);

}

ko.applyBindings(new BannerMakerViewModel());