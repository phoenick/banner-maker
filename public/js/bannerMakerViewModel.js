/* TODO
-undo object selection incurred zindex change

*/
function Slide(id, bannerSize, interConf){
    var self = this;
    self.canvasId = "bm-canvas-" + id;
    self.$canvasCont = $("<div> <canvas id='" + self.canvasId + "'></canvas> </div>");
    self.interConf = interConf;
    self.selectedObject = null;
    self.slidePreview = null;
    self.dirty = false;

    self.canvas = new fabric.Canvas(self.$canvasCont.find("canvas")[0], {
        width: bannerSize.width(),
        height: bannerSize.height(),
    });
    /* Events of interest:
        object:added
        object:modified //to include in the future
        object:rotating
        object:scaling
        object:moving */
    
    self.canvas.on('object:added', function(e) {
        if(self.slidePreview){
            self.slidePreview.img(self.canvas.toDataURL());
        }

    });
    self.canvas.on('object:rotating', function(e) {
        self.dirty = true;
    });
    self.canvas.on('object:scaling', function(e) {
        self.dirty = true;
    });
    self.canvas.on('object:moving', function(e) {
        self.dirty = true;
    });
    //--It all comes down to this:
    self.canvas.on('mouse:up', function(e) {
        if(self.dirty == true){
            self.dirty = false;
            self.slidePreview.img(self.canvas.toDataURL());
        }
        
    });


    self.canvas.on('object:selected', function(e) {
        e.target.bringToFront();
        self.selectedObject = e.target;
        self.slidePreview.img(self.canvas.toDataURL());
        console.log("object selected");
    });
    self.canvas.on('selection:cleared', function(e) {
        self.selectedObject = null;
        console.log("object deselected");
    });

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
    self.canvas.add(rect);
    rect.bringToFront();

    self.setSlidePreview = function(slidePreview){
        self.slidePreview = slidePreview;
    }
    self.addImage = function(image, bannerSize) {

        fabric.Image.fromURL(image, function(oImg) {
            oImg.set(self.interConf);
            //todo: if bannerWidth > bannerHeight
            if(oImg.getWidth() > bannerSize.width()){
                console.log("width: " + oImg.getWidth() + ", height: " + oImg.getHeight() );
                oImg.scaleToWidth(bannerSize.width() - 30);
            }
            if(oImg.getHeight() > bannerSize.height()){
                console.log("height!");
                oImg.scaleToHeight(bannerSize.height() - 30);
            }
            //setLeft(100).setTop(100).scaleToHeight(150);
            self.canvas.add(oImg);
            oImg.bringToFront();
            oImg.center();
            oImg.setCoords();
            self.canvas.setActiveObject(oImg);
            var canvas = document.getElementById('bm-canvas-0');
            var dataURL = self.canvas.toDataURL();
            document.getElementById('mirror').src = dataURL;
            //self.canvas.remove(oImg);
        });
    }
    // $("body").append(self.$canvasCont);
}

function SlidePreview(bannerSize){
    var self = this;
    self.bannerSize = bannerSize;
    self.img = ko.observable("images/empty.png");

    self.dimensions = ko.computed(function() {
        var stWidth = 280 - 4;
        var stHeight = 120 - 4;
        var simgWidth, simgHeight, simgTop, simgLeft;
        simgHeight = (bannerSize.height()*stWidth)/bannerSize.width();
        if(simgHeight <= stHeight){
            simgTop = stHeight/2 - simgHeight/2;
            var res = {
                height: simgHeight + 'px',
                width: '100%',
                top: simgTop + 'px',
                left: 0 + 'px'
            };
            console.log(JSON.stringify(res));
            return res;
            // $$previews[0].find(".slide-img").css({height: simgHeight, width: '100%',
            //                                 top: simgTop, left: 0});
        }
        else{
            simgWidth = bannerSize.width()*stHeight/bannerSize.height();
            simgLeft = stWidth/2 - simgWidth/2;
            var res = {
                height: '100%',
                width: simgWidth + 'px',
                top: 0 + 'px',
                left: simgLeft + 'px'
            };
            console.log(JSON.stringify(res));
            return res;
            // $$previews[0].find(".slide-img").css({width: simgWidth, height: '100%',
            //                                 left: simgLeft, top: 0});
        }

    });
}

function BannerMakerViewModel(){
    var self = this;
    self.swidth = ko.observable("");
    self.sheight = ko.observable("");
    // self.bannerSize = {
    //     width: ko.computed(function() {
    //                 return parseInt(self.swidth());
    //             }), 
    //     height: ko.computed(function() {
    //                 return parseInt(self.sheight());
    //             }), 
    // };

    self.bannerSize = {
        width: ko.observable(728), 
        height: ko.observable(280)
    };
    
    

    self.test = ko.observable(true);
    //interaction layer configuration - appearance and behaviour of controls
    self.interConf = {  
        transparentCorners: false,
        cornerSize: 10,
        rotatingPointOffset: 25
    };

    self.newSlideId = (function(){
        var id = 0;
        return function(){
            return id++;
        };
    })();

    self.slides = ko.observableArray([]);
    self.slidePreviews = ko.observableArray([]);
    

    var slide = new Slide(self.newSlideId(), self.bannerSize, self.interConf);
    var slidePreview = new SlidePreview(self.bannerSize);
    slide.setSlidePreview(slidePreview);
    self.slides.push(slide);
    self.slidePreviews.push(slidePreview);

    self.currentSlide = slide;


    self.addImage = function(image){
        self.currentSlide.addImage(image, self.bannerSize);
    }
    // setTimeout(function(){
    //     var canvas = document.getElementById('bm-canvas-0');
    //     var dataURL = canvas.toDataURL();
    //      console.log(dataURL);
    // }, 2000);
    // setTimeout(function(){
    //     var canvas = document.getElementById('bm-canvas-0');
    //     var dataURL = canvas.toDataURL();
    //     console.log(dataURL);
    //     document.getElementById('mirror').src = dataURL;
    // }, 8000);
    
    // canvasf = new fabric.Canvas('canvasp');
    // var rect2 = new fabric.Rect({
    //     left: 100,
    //     top: 100,
    //     fill: 'green',
    //     width: 120,
    //     height: 120,
    //     angle: 45,
    //     transparentCorners: false,
    //     cornerSize: 10,
    //     rotatingPointOffset: 25
    // });
    // canvasf.add(rect2);
    
   

/*==================================================
 * File upload
 * ===============================================*/
    document.getElementById('choose-file').onchange = function (evt) {

        var tgt = evt.target || window.event.srcElement,
            files = tgt.files;

        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            fr.onload = function () {
                //addImage(fr.result);
                self.addImage(fr.result);
            }
            fr.readAsDataURL(files[0]);
            $("#choose-file").val(null);

        }

        // Not supported
        else {
            alert("Sorry but your browser doesn't support loading files directly");
        }
    };
    
    self.uploadImage = function() {
        $("#choose-file").click();
    }

    // var canvas = new fabric.Canvas('canvasp');
    // //canvas.set(interConf);
    // var rect = new fabric.Rect({
    //     left: 200,
    //     top: 100,
    //     fill: 'red',
    //     width: 120,
    //     height: 120,
    //     angle: 45,
    //     transparentCorners: false,
    //     cornerSize: 10,
    //     rotatingPointOffset: 25
    // });
    // var rect2 = new fabric.Rect({
    //     left: 100,
    //     top: 100,
    //     fill: 'green',
    //     width: 120,
    //     height: 120,
    //     angle: 45,
    //     transparentCorners: false,
    //     cornerSize: 10,
    //     rotatingPointOffset: 25
    // });
    // canvas.add(rect);
    // canvas.add(rect2);
    // rect.setCoords();

    // canvas.on('mouse:down', function(e) { });
    // canvas.on('mouse:up', function(e) { console.log("mouse up");});
    // canvas.on('object:moving', function(e) { console.log("object:moving");});
    // canvas.on('object:selected', function(e) {
    //     e.target.bringToFront();
    // });
    

    
    // var filter = new fabric.Image.filters.Resize();
    // filter.applyTo(canvas, 0.5, 0.5);

}

ko.bindingHandlers.canvas = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        
        var slide = valueAccessor();
        console.log("hey " + slide.canvasId);
        $(element).empty().append(slide.$canvasCont);
        ko.unwrap(slide);
        
        //console.log(JSON.stringify(ko.unwrap(slide)));
        // if(ko.unwrap(slide)){
        //     //$(element).empty().append(slide.$canvasCont);
        //     console.log("aha");
        // }

    },
    // update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    //     // This will be called once when the binding is first applied to an element,
    //     // and again whenever any observables/computeds that are accessed change
    //     // Update the DOM element based on the supplied values here.
    //     var slide = valueAccessor();
    //     console.log(JSON.stringify(slide));
    //     if(slide){
    //         $(element).empty().append(slide.$canvasCont);
    //     }
    // }
};

ko.applyBindings(new BannerMakerViewModel());