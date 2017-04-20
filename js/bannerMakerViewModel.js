
function Slide(id, bannerSize, interConf){
    var self = this;
    self.canvasId = "bm-canvas-" + id;

    self.$canvasCont = $("<div> <canvas id='" + self.canvasId + "'></canvas> </div>");

    self.canvas = new fabric.Canvas(self.$canvasCont.find("canvas")[0], {
        width: bannerSize.width(),
        height: bannerSize.height(),
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

    // $("body").append(self.$canvasCont);
}


function BannerMakerViewModel(){
    var self = this;

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

    self.slide = new Slide(self.newSlideId(), self.bannerSize, self.interConf);
    self.slidePreview = null;
    new Slide(self.newSlideId(), self.bannerSize, self.interConf);
    new Slide(self.newSlideId(), self.bannerSize, self.interConf);
    new Slide(self.newSlideId(), self.bannerSize, self.interConf);

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
                alert("ok");

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