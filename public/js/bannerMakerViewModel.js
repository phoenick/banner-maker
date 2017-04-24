/* TODO
-undo object selection incurred zindex change
-flip X Y
-delete all selected objects
-send to back/front
-set option

Issues:
-duplicate on multiple selected items doesn't work properly

New Features:
-undo per slide
-
*/
function Slide(id, bannerSize, interConf){
    var self = this;
    self.canvasId = "bm-canvas-" + id;
    self.$canvasCont = $("<div> <canvas id='" + self.canvasId + "'></canvas> </div>");
    self.interConf = interConf;
    self.selectedObject = ko.observable();
    self.selObjState = null;
    self.selObjModState = {
        left: 0, top: 0, scaleX: 0, scaleY: 0, angle: 0
    };
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

    self.undoStack = [];
    self.iundo = ko.observable(-1);

    self.undoPush = function(action){
        if(self.undoStack.length > self.iundo() + 1){
            self.undoStack.splice(self.iundo() + 1, self.undoStack.length -(self.iundo() + 1));
        }
        self.undoStack.push(action);
        self.iundo(self.iundo() + 1);
    }

    self.undo = function(){
        //console.log(JSON.stringify(self.undoStack));
        // console.log("iundo: " + self.iundo());
        // for (var i = 0; i < self.undoStack.length; i++) {
        //     console.log(self.undoStack[i].state);
        // }
        if(self.iundo() >= 0){
            var laction = self.undoStack[self.iundo()];
            switch(laction.action){
                case "add":
                    self.canvas.remove(laction.item);
                    self.iundo(self.iundo() - 1);
                    break;
                case "transform":
                    if(self.iundo() >= 1){
                        self.iundo(self.iundo() - 1);
                        var prevAction = self.undoStack[self.iundo()];
                        //console.log(JSON.stringify(prevAction.state));
                        self.setTransformState(prevAction.item, prevAction.state);
                        prevAction.item.setCoords();
                        self.canvas.renderAll();

                        //self.setTransformState(prevAction.item, prevAction.state);
                    }
                    break;
                case "delete":
                    break;
            }
        }
        self.updateSlidePreview();
    }

    self.redo = function(){
         if(iundo < undoStack.length - 1){
            iundo++;
            var laction = undoStack[iundo];
            var $laitem = laction.item;
            $laitem.css({
                top: $laitem.position().top + laction.dstate.dtop,
                left: $laitem.position().left + laction.dstate.dleft,
            });
            
            $laitem.find(".imain").rotate(laction.dstate.curRot);

            if(!$laitem.is(".textDiv")){
                $laitem.css({
                    width: $laitem.width() + laction.dstate.dwidth,
                    height: $laitem.height() + laction.dstate.dheight
                });
            }
            updateCtrlPosEl($laitem);
        }
    }

    function clearUndoStack(){
        self.undoStack = [];
        self.iundo = -1;
    }
    
    self.getTransformState = function(obj){
        return {
            left: obj.getLeft(),
            top: obj.getTop(),
            scaleX: obj.getScaleX(),
            scaleY: obj.getScaleY(),
            angle: obj.getAngle()
        };
    }
    self.setTransformState = function(obj, state){
        obj.set({
            left: state.left,
            top: state.top,
            scaleX: state.scaleX,
            scaleY: state.scaleY,
            angle: state.angle
        });
        obj.setCoords();
    }

    self.updateModState = function(){
        var so = self.selectedObject();
        self.selObjModState.left = so.getLeft();
        self.selObjModState.top = so.getTop();
        self.selObjModState.scaleX = so.getScaleX();
        self.selObjModState.scaleY = so.getScaleY();
        self.selObjModState.angle = so.getAngle();
    }
    self.canvas.on('object:added', function(e) {
        if(self.slidePreview){
            self.updateSlidePreview();
        }
        //console.log(JSON.stringify(e.target));
        self.undoPush({
            action: "add",
            item: e.target,
            state: self.getTransformState(e.target)
        });
        //todo: undo push here?
    });
    self.canvas.on('object:rotating', function(e) {
        self.dirty = true;
        //self.updateModState();
    });
    self.canvas.on('object:scaling', function(e) {
        self.dirty = true;
        //self.updateModState();
    });
    self.canvas.on('object:moving', function(e) {
        self.dirty = true;
        //self.updateModState();
    });
    //--It all comes down to this:
    self.canvas.on('mouse:up', function(e) {
        if(self.dirty == true){
            self.dirty = false;
            var so = self.selObjModState;
            self.selObjState = {
                item: self.selectedObject(),
                left: so.left,
                top: so.top,
                scaleX: so.scaleX,
                scaleY: so.scaleY,
                angle: so.angle
            };
            
            self.undoPush({
                action: "transform",
                item: self.selectedObject(),
                state: self.getTransformState(self.selectedObject())
            });

            self.updateSlidePreview();
        }
        
    });
    self.canvas.on('object:selected', function(e) {
        e.target.bringToFront();
        self.selectedObject(e.target);
        var so = e.target;
        self.selObjState = {
            item: e.target,
            left: so.getLeft(),
            top: so.getTop(),
            scaleX: so.getScaleX(),
            scaleY: so.getScaleY(),
            angle: so.getAngle()
        };
        //console.log(JSON.stringify(self.selObjState));
        self.updateSlidePreview();
        console.log("object selected");
    });
    self.canvas.on('selection:cleared', function(e) {
        self.selectedObject(null);
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
    self.updateSlidePreview = function(){
        self.slidePreview.img(self.canvas.toDataURL());
    }

    self.centerSelectedObject = function(){
        if(self.selectedObject()){
            self.selectedObject().center().setCoords();
            self.updateSlidePreview();
        }
    }

    self.deleteSelectedObject = function(){
        if(self.selectedObject()){
            self.canvas.remove(self.selectedObject());
            self.undoPush({
                action: "delete",
                item: self.selectedObject()
            });

            self.updateSlidePreview();
        }
    }

    self.duplicateSelectedObject = function(){
        if(self.selectedObject()){
            self.selectedObject().clone(function(dupObj){
                dupObj.set(self.interConf);
                self.canvas.add(dupObj);
                var initLeft = dupObj.getLeft();
                dupObj.setLeft(initLeft + 30);
                dupObj.setCoords();
                self.canvas.setActiveObject(dupObj);
                //self.updateSlidePreview();
            });
            
        }
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

            // self.undoPush({
            //     action: "add",
            //     item: oImg
            // });

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

    self.currentSlide = ko.observable(slide);
    self.icurSlide = ko.observable(0);
    
    self.setCurrentSlide = function(index){
        self.currentSlide(self.slides[index]());
        self.icurSlide(index);
    }

    self.addImage = function(image){
        self.currentSlide().addImage(image, self.bannerSize);
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