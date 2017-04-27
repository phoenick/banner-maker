/* TODO
-undo object selection incurred zindex change
-flip X Y
-delete all selected objects
-send to back/front
-set option
-undo redo selects action object? but then messes with the z order
-user can create guidelines
-canvas function moveTo(object, index) related to z order
-lock x y on object toolbar

Issues:
-duplicate on multiple selected items doesn't work properly
-undo should be per object

New Features:
-undo per slide
-
*/
function Slide(id, bannerSize, interConf){
    var self = this;
    // if(canvas){
    //     self.canvas
    // }
    self.canvasId = "bm-canvas-" + id;
    self.previewId = "bm-preview-" + id;
    self.$canvasCont = $("<div> <canvas id='" + self.canvasId + "'></canvas> </div>");
    self.interConf = interConf;
    self.selectedObject = ko.observable();
    self.selObjState = null;
    self.selObjModState = {
        left: 0, top: 0, scaleX: 0, scaleY: 0, angle: 0
    };
    self.slidePreview = null;
    self.dirty = false;
    self.delay = ko.observable(1);

    self.backgroundColor = ko.observable("#fff");
    self.backgroundColor.subscribe(function(newValue) {
        self.canvas.setBackgroundColor(newValue).renderAll();
        self.updateSlidePreview();
    });

    self.URL = ko.observable("http://www.example.com");

    self.canvas = new fabric.Canvas(self.$canvasCont.find("canvas")[0], {
        width: bannerSize.width(),
        height: bannerSize.height(),
    });

    self.incrementDelay = function(){
        self.delay(self.delay() + 1);
    }
    self.decrementDelay = function(){
        if(self.delay() > 1){
            self.delay(self.delay() - 1);
        }
    }

    self.cloneCanvas = function(){
        self.canvas.clone(function(dupcan){
            console.log(JSON.stringify(dupcan));
            $("body").append(dupcan).append("hello");
        });
    }

    self.setCanvasJSON = function(canvasJSON){
        self.canvas.loadFromJSON(canvasJSON, function(){
            var objects = self.canvas.getObjects();
            for(var i = 0; i < objects.length; i++){
                objects[i].set(self.interConf);
                objects[i].bmInitState = {
                    left: objects[i].getLeft(),
                    top: objects[i].getTop(),
                    scaleX: objects[i].getScaleX(),
                    scaleY: objects[i].getScaleY(),
                    angle: objects[i].getAngle()
                };
            }

            self.canvas.renderAll();
            self.updateSlidePreview();
        });
    }

    self.getCanvasJSON = function(){
        return self.canvas.toJSON();
    }

    /* Events of interest:
        object:added
        object:modified //to include in the future
        object:rotating
        object:scaling
        object:moving */

    self.undoStack = [];
    self.iundo = ko.observable(-1);
    self.objectAddedFromRedo = false;

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
                    else{
                        self.iundo(self.iundo() - 1);
                        self.setTransformState(laction.item, laction.item.bmInitState);
                        laction.item.setCoords();
                        self.canvas.renderAll();
                    }
                    break;
                case "delete":
                    self.canvas.add(laction.item);
                    self.iundo(self.iundo() - 1);
                    break;
                case "clear slide":
                    var objects = laction.items;
                    var arrayLength = objects.length;
                    for (var i = 0; i < arrayLength; i++) {
                        //objects[i].setTop(20).setCoords();
                        self.canvas.add(objects[i]);
                    }
                    //self.canvas.renderAll();

                    self.iundo(self.iundo() - 1);
                    break;
            }
            self.updateSlidePreview();
        }
        
    }

    self.redo = function(){
        if(self.iundo() < self.undoStack.length - 1){
            console.log("redo");
            self.iundo(self.iundo() + 1);
            var laction = self.undoStack[self.iundo()];
            switch(laction.action){
                case "add":
                    //self.objectAddedFromRedo = true;
                    self.canvas.add(laction.item);
                    break;
                case "transform":
                    self.setTransformState(laction.item, laction.state);
                    laction.item.setCoords();
                    self.canvas.renderAll();
                    break;
                case "delete":
                    self.canvas.remove(laction.item);
                    break;
                case "clear slide":
                    var objects = laction.items;
                    var arrayLength = objects.length;
                    for (var i = 0; i < arrayLength; i++) {
                        self.canvas.remove(objects[i]);
                    }
                    break;
            }
            self.updateSlidePreview();
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
    // self.canvas.add(rect);
    // rect.bringToFront();


    self.setSlidePreview = function(slidePreview){
        self.slidePreview = slidePreview;
    }
    self.updateSlidePreview = function(){
        self.slidePreview.img(self.canvas.toDataURL());
    }

    self.clearSlide = function(){
        var objects = self.canvas.getObjects().slice();
        var arrayLength = objects.length;
        console.log("ar length: " + arrayLength);
        for (var i = 0; i < arrayLength; i++) {
            //objects[i].setTop(20).setCoords();
            self.canvas.remove(objects[i]);
        }
        //self.canvas.renderAll();
        self.undoPush({
            action: "clear slide",
            items: objects
        });

        self.updateSlidePreview();
    }

    self.centerSelectedObject = function(){
        if(self.selectedObject()){
            self.selectedObject().center().setCoords();
            self.undoPush({
                action: "transform",
                item: self.selectedObject(),
                state: self.getTransformState(self.selectedObject())
            });

            self.updateSlidePreview();
        }
    }

    self.deleteSelectedObject = function(){
        if(self.selectedObject()){
            var so = self.selectedObject();
            self.canvas.remove(so);
            self.undoPush({
                action: "delete",
                item: so
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
                var initTop = dupObj.getTop();
                dupObj.setLeft(initLeft + 30);
                dupObj.setTop(initTop + 30);
                dupObj.setCoords();
                //if the object is text
                if(dupObj.fontFamily){
                    dupObj.on('editing:entered', function(e) { 
                        $("#text-edit").show();
                    });
                    dupObj.on('editing:exited', function(e) {
                        self.updateSlidePreview();
                        $("#text-edit").hide();
                    });
                }
                self.canvas.setActiveObject(dupObj);
                self.undoPush({
                    action: "add",
                    item: dupObj,
                    state: self.getTransformState(dupObj)
                });
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

            self.undoPush({
                action: "add",
                item: oImg,
                state: self.getTransformState(oImg)
            });


            // self.undoPush({
            //     action: "add",
            //     item: oImg
            // });

            // var canvas = document.getElementById('bm-canvas-0');
            // var dataURL = self.canvas.toDataURL();
            // document.getElementById('mirror').src = dataURL;
            //self.canvas.remove(oImg);
        });
    }


    self.addText = function() {

            var iText = new fabric.IText('Double click to edit', {

                fontFamily: 'Segoe UI',
                fill: '#000',
                styles: {
                    0: {
                       
                    }
                }
            });

            //setLeft(100).setTop(100).scaleToHeight(150);
            iText.set(self.interConf);
            iText.set({padding: 10});
            iText.on('editing:entered', function(e) { 
                $("#text-edit").show();
            });
            iText.on('editing:exited', function(e) {
                self.updateSlidePreview();
                $("#text-edit").hide();
            });


            self.canvas.add(iText);
            iText.bringToFront();
            iText.center();
            iText.setCoords();
            self.canvas.setActiveObject(iText);

            self.undoPush({
                action: "add",
                item: iText,
                state: self.getTransformState(iText)
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

    self.fonts = [
        "Georgia", "Palatino", "Times", "Segoe UI", "Arial", "Arial Black", "Impact", "Courier"
    ];

    self.slides = ko.observableArray([]);

    

    var slide = new Slide(self.newSlideId(), self.bannerSize, self.interConf);
    var slidePreview = new SlidePreview(self.bannerSize);
    slide.setSlidePreview(slidePreview);
    self.slides.push(slide);

    self.currentSlide = ko.observable(slide);
    self.icurSlide = ko.observable(0);
    
    self.setCurrentSlide = function(index){
        self.currentSlide(self.slides()[index]);
        self.icurSlide(index);
    }

    self.selectSlide = function(slide){
        self.currentSlide(slide);
        self.icurSlide(self.slides.indexOf(slide));

        var $parentDiv = $("#previews-container");
        var $curSlidePrev = $("#" + slide.previewId);
        var parScrollTop = $parentDiv.scrollTop() + $curSlidePrev.position().top
            - $parentDiv.height()/2 + $curSlidePrev.height()/2;
        $parentDiv.animate({scrollTop: parScrollTop}, 300);
    }

    self.addSlide = function(){
        var slide = new Slide(self.newSlideId(), self.bannerSize, self.interConf);
        var slidePreview = new SlidePreview(self.bannerSize);
        slide.setSlidePreview(slidePreview);
        self.slides.push(slide);
        self.selectSlide(slide)

    }

    self.duplicateCurrentSlide = function(){
        var slide = new Slide(self.newSlideId(), self.bannerSize, self.interConf);
        var slidePreview = new SlidePreview(self.bannerSize);
        slide.setSlidePreview(slidePreview);
        slide.setCanvasJSON(self.currentSlide().getCanvasJSON());

        self.slides.splice(self.icurSlide() + 1, 0, slide);

        self.selectSlide(slide);
        var objects = self.currentSlide().canvas.getObjects();
        for(var i = 0; i < objects.length; i++){
            if(objects[i].fontFamily){
                objects[i].on('editing:entered', function(e) { 
                    $("#text-edit").show();
                });
                objects[i].on('editing:exited', function(e) {
                    self.updateSlidePreview(); //possible issue
                    $("#text-edit").hide();
                });
            }
        }
    }

    self.updateSlidePreview = function(){
        self.currentSlide().updateSlidePreview(); //possible issue
    }

    self.addImage = function(image){
        self.currentSlide().addImage(image, self.bannerSize);
    }
    self.addText = function(){
        self.currentSlide().addText();
    }

    
    self.setStyle = function (object, styleName, value) {
        if (object.setSelectionStyles && object.isEditing) {
            var style = { };
            style[styleName] = value;
            object.setSelectionStyles(style);
        }
        else {
            object[styleName] = value;
        }
    }
    self.getStyle = function (object, styleName) {
        return (object.getSelectionStyles && object.isEditing)
        ? object.getSelectionStyles()[styleName]
        : object[styleName];
    }
    self.textEdit = function(command, value, data, event){
        switch(command){
            case 'bold': 
                var isBold = self.getStyle(self.currentSlide().selectedObject(), 'fontWeight') === 'bold';
                self.setStyle(self.currentSlide().selectedObject(), 'fontWeight', isBold ? '' : 'bold');
                self.currentSlide().canvas.renderAll();
                break;
            case 'italic': 
                var isItalic = self.getStyle(self.currentSlide().selectedObject(), 'fontStyle') === 'italic';
                self.setStyle(self.currentSlide().selectedObject(), 'fontStyle', isItalic ? '' : 'italic');
                self.currentSlide().canvas.renderAll();
                break;
            case 'underline': 
                var isUnderline = (self.getStyle(self.currentSlide().selectedObject(), 'textDecoration') || '').indexOf('underline') > -1;
                self.setStyle(self.currentSlide().selectedObject(), 'textDecoration', isUnderline ? '' : 'underline');
                self.currentSlide().canvas.renderAll();
                break;
            case 'align':
                if(value == "left"){
                    self.currentSlide().selectedObject().set({textAlign: "left"});
                }
                else if(value == "center"){
                    self.currentSlide().selectedObject().set({textAlign: "center"});
                }
                else if(value == "right"){
                    self.currentSlide().selectedObject().set({textAlign: "right"});
                }
                self.currentSlide().canvas.renderAll();
                break;
        }
    }
    self.textColor = ko.observable("#000");
    self.textBgColor = ko.observable("#fff");
    self.textColor.subscribe(function(newValue) {
        self.setStyle(self.currentSlide().selectedObject(), 'fill', newValue);
        self.currentSlide().canvas.renderAll();
    });
    self.textBgColor.subscribe(function(newValue) {
        self.setStyle(self.currentSlide().selectedObject(), 'textBackgroundColor', newValue);
        self.currentSlide().canvas.renderAll();
    });

    self.setTextFont = function(data){
        self.setStyle(self.currentSlide().selectedObject(), 'fontFamily', data);
        self.currentSlide().canvas.renderAll();
    }

    self.textSize = ko.observable(40);
    self.textSize.subscribe(function(newValue) {
        self.setStyle(self.currentSlide().selectedObject(), 'fontSize', parseInt(newValue, 10));
        self.currentSlide().canvas.renderAll();
    });
    
    $("#previews-container").sortable({
        tolerance: "pointer",
        placeholder:'preview-holder',
        handle: '.mid-ctrl',
        forcePlaceholderSize: true,
        scroll: true,
        start: function( event, ui ) {
           $(".slide-preview.current .preview-toolbar").hide();
           sortStartIndex = $("#previews-container").children().index(ui.item);
           console.log(sortStartIndex);
        },
        stop: function( event, ui ) {
           $(".slide-preview.current .preview-toolbar").show();
           sortStopIndex = $("#previews-container").children().index(ui.item);
           console.log(sortStopIndex + "---");
           //updateSortOrder();
           //updateSortOrder
        }
    });

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