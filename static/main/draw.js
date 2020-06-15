            let obj = {};
            let isDraw = false;
            let count = 0;
            let zoneDraw, lineDraw = false;
            let lineShape, zoneShape, pointShape;

            let stageWidth = 1280;
            let stageHeight = 720;

            let stage = new Konva.Stage({
                container: 'container',
                width: stageWidth,
                height: stageHeight,
            });

            let labelLayer = new Konva.Layer();
            let drawingLayer = new Konva.Layer();
            
            $('#line').click( () => {
                lineDraw = true;
                zoneDraw = false;

                count++;

                let LineCoordinates = [];

                stage.on('click', () => {      
                    if(zoneDraw == false && lineDraw == true){
                        let pos = stage.getPointerPosition();

                        LineCoordinates.push(pos.x, pos.y);
                        obj[count] =  __get1DArray(LineCoordinates).toString();

                        __lineDraw(__get1DArray(LineCoordinates), count);
                        __drawPoint(pos.x, pos.y, 'yellow');
                        
                        drawingLayer.draw();
                        labelLayer.draw();
                        labelLayer.moveToTop();
                    }
                });

                stage.on('mousemove', () => {
                    if (LineCoordinates.length > 2){
                        lineDraw = false;
                        LineCoordinates = [];
                        
                    }
                });
            });

            $('#SaveContainer').hide();

            $('#poly').click( () => {
                zoneDraw = true;
                lineDraw = false;

                count++;

                let coordinates = [];
                $('#polyContainer').hide();
                $('#SaveContainer').show();

                stage.on('click', () => {
                    if(zoneDraw == true && lineDraw == false){
                        let pos = stage.getPointerPosition();
                        coordinates.push(pos.x, pos.y);
                        let arrToString = coordinates.toString();
                        obj[count] = arrToString;

                        __ZoneDraw(coordinates, count);                
                        __drawPoint(pos.x, pos.y, 'red');

                        labelLayer.draw();
                        drawingLayer.draw();
                        labelLayer.moveToTop();
                    }
                });

                $('#Save').click( () => {
                    zoneDraw = false;
                    $('#polyContainer').show();
                    $('#SaveContainer').hide();
                    coordinates = [];
 
                });
                
            });

            __sizeObject = (obj) => {
                let size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) size++;
                }
                return size;
            }

            __get1DArray = (arr) => {
                return arr.join().split(",");
            }

            __drawPoint = (x, y, color) => {
                pointShape = new Konva.Circle({
                    x: x,
                    y: y,
                    fill: color,
                    radius: 6,
                });

                labelLayer.add(pointShape);
            }

            __lineDraw = (position, nameShape) => {
                lineShape = new Konva.Line({
                    points: position,
                    stroke: 'red',
                    strokeWidth: 5,
                    lineCap: 'round',
                    lineJoin: 'round',
                    id: nameShape,
                });

                __labelDraw(lineShape, 'Line');
                    
                drawingLayer.add(lineShape);
            }

            __ZoneDraw = (position, nameShape) => {
                zoneShape = new Konva.Line({
                    points: position,
                    stroke: 'yellow',
                    strokeWidth: 5,
                    lineCap: 'round',
                    lineJoin: 'round',
                    closed: true,
                    id: nameShape,
                });

                __labelDraw(zoneShape, 'Zone');

                drawingLayer.add(zoneShape);
            }

            __labelDraw = (shape, type) => {
                shape.on('mouseover', (evt) => {
                    let node = evt.target;

                    if(node){
                        let mousePos = node.getStage().getPointerPosition();

                        tooltip.position({
                            x: mousePos.x,
                            y: mousePos.y
                        });

                        tooltip.getText().text('ID : ' + node.id() + ', Type : ' + type);

                        tooltip.show();
                        tooltip.moveToTop();
                        labelLayer.batchDraw();
                    }
                });

                shape.on('mouseout', (evt) => {
                    tooltip.hide();
                    labelLayer.draw();
                });
            }

            $('#clear').click( () => {
                obj = {};
                coordinates = [];
                LineCoordinates = [];
                count = 0;
                drawingLayer.find('Line').destroy();
                labelLayer.find('Circle').destroy();
                drawingLayer.draw();
                labelLayer.draw();
            });

            let tooltip = new Konva.Label({
                opacity: 0.75,
                visible: false,
                listening: false,
            });

            tooltip.add(
                new Konva.Tag({
                    fill: 'yellow',
                    pointerDirection: 'down',
                    pointerWidth: 10,
                    pointerHeight: 10,
                    lineJoin: 'round',
                    shadowColor: 'black',
                    shadowBlur: 10,
                    shadowOffsetX: 10,
                    shadowOffsetY: 10,
                    shadowOpacity: 0.2,
                })
            );

            tooltip.add(
                new Konva.Text({
                    text: '',
                    fontFamily: 'Calibri',
                    fontSize: 24,
                    padding: 5,
                    fill: 'black',
                })
            );

            labelLayer.add(tooltip);

            stage.add(labelLayer);
            stage.add(drawingLayer);

            $('#saveJSON').click( () => {
                if(jQuery.isEmptyObject(obj) == true){
                    alert('Drawing First');
                } else {
                    let jsonTest = JSON.stringify(obj);

                    alert('Saved');

                    $.ajax({
                        url: '/setup/zone',
                        type: 'post',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: jsonTest
                    });
                }
            });

            $('#restartBTN').click( () => {
                let data = {
                    'command' : 'restart'
                }

                $.ajax({
                    url: '/setup/zone',
                    type: 'post',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(data)
                });
            });