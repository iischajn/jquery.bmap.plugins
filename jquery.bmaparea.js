(function($) {
    function JBMapArea(id, bdmap) {
        if (!BMap || !$.cache || !id || !bdmap) {
            return false;
        }
        this.id = id;
        this.map = bdmap;
    }

    $.extend(JBMapArea.prototype, {
        data: [],
        colors: ['#00ff00', '#0000ff', '#ff0000', '#ffa500', '#9900ff', '#ffbbff', '#ffff00', '#a52a2a', ' #434343', '#ffffff'],
        colorName: ['绿色', '蓝色', '红色', '橙色', '紫色', '粉色', '黄色', '棕色', '灰色', '白色'],
        list: [],
        len: 0,
        on: function(event, cb) {
            $(this).on(event, cb);
        },
        fire: function(event, data) {
            $(this).trigger(event, data);
        },
        init: function() {
            var that = this;
            var mainMenu = new BMap.ContextMenu();
            mainMenu.addItem(new BMap.MenuItem("添加区域", onMenuAddArea));
            that.map.addContextMenu(mainMenu);

            function onMenuAddArea(point, pixel) {
                var x = pixel.x;
                var y = pixel.y;
                that.addArea([
                    that.map.pixelToPoint(new BMap.Pixel(x - 200, y - 200)),
                    that.map.pixelToPoint(new BMap.Pixel(x + 200, y - 200)),
                    that.map.pixelToPoint(new BMap.Pixel(x + 200, y + 200)),
                    that.map.pixelToPoint(new BMap.Pixel(x - 200, y + 200))
                ]);
            }
        },
        addArea: function(pointList) {
            var that = this;
            var area = new BMap.Polygon(pointList, {
                strokeColor: "black",
                fillColor: that.colors[that.list.length],
                strokeWeight: 2,
                strokeOpacity: 0.5,
                fillOpacity: 0.6
            });
            that.map.addOverlay(area);
            that.list.push(area);

            var rMenu = {
                "修改区域": editArea,
                "删除区域": removeArea
            };
            var okMenu = {
                "确定修改": editOkArea,
                "取消修改": editCancelArea
            };

            that.addMenu(area, rMenu);

            var currentAreaPath;

            function removeArea(point, pixel, area) {
                if (confirm('确定要删除此区域？')) {
                    var index = that.list.indexOf(area);
                    index > -1 && that.list.splice(index, 1);
                    area.remove();
                    that.save();
                }
            }

            function editArea(point, pixel, area) {
                currentAreaPath = area.getPath();
                area.enableEditing();
                area.removeContextMenu();
                that.addMenu(area, okMenu);
            }

            function editOkArea(point, pixel, area) {
                area.disableEditing();
                area.removeContextMenu();
                that.save();
                that.addMenu(area, rMenu);
            }

            function editCancelArea(point, pixel, area) {
                currentAreaPath && area.setPath(currentAreaPath);
                editOkArea(point, pixel, area);
            }
        },
        addMenu: function(area, op) {
            var areaMenu = new BMap.ContextMenu();
            for (var name in op) {
                areaMenu.addItem(new BMap.MenuItem(name, op[name]));
            }
            area.addContextMenu(areaMenu);
        },
        getData: function() {
            return this.data;
        },
        setData: function(data) {
            this.data = data;
        },
        getAreaByColor: function(color) {
            return this.colorName[this.colors.indexOf(color)] || "其它";
        },
        clear: function() {
            var that = this;
            that.list.length && $.each(that.list, function(i, area) {
                area.remove();
            });
            that.list = [];
        },
        load: function(cityId, areaList) {
            var that = this;
            that.clear();
            that.cityId = cityId;
            areaList && $.each(areaList, function(i, path) {
                var pointList = path.map(function(aPoint) {
                    return new BMap.Point(aPoint.lng, aPoint.lat);
                });
                that.addArea(pointList);
            });
        },
        save: function() {
            var that = this;
            var cityArea = {};
            cityArea.areaList = [];
            that.list.length && $.each(that.list, function(i, area) {
                var pointList = area.getPath();
                cityArea.areaList.push(pointList);
            });
            that.fire('area-save', [that.cityId, cityArea]);
        },
        show:function(){
            this.list.length && $.each(this.list, function(i, area) {
                area.show();
            });
        },
        hide:function(){
            this.list.length && $.each(this.list, function(i, area) {
                area.hide();
            });
        },
        parseData: function() {
            var that = this;
            var container = $(that.map.getContainer());
            var box = container.children().first();
            var svg = container.find('svg');
            if (!svg.length) {
                that.fire('data-parse', [false, "请先右键添加区域"]);
                return false;
            }
            svg.removeAttr('x');
            svg.removeAttr('y');
            var bx = parseInt(box.css('left'), 10);
            var by = parseInt(box.css('top'), 10);
            var sx = parseInt(svg.css('left'), 10);
            var sy = parseInt(svg.css('top'), 10);
            var style = svg.attr('style');
            var svgHtml = svg[0].outerHTML;
            var canvas = $('#canvas');
            window.canvg(canvas[0], svgHtml);
            canvas.css({
                top: bx + sx,
                left: by + sy
            });

            setTimeout(parse, 1000);

            function parse() {
                var canvas = $('#canvas');
                var context = canvas[0].getContext("2d");

                var cx = parseInt(canvas.css('left'), 10);
                var cy = parseInt(canvas.css('top'), 10);
                var obj = {};

                $.each(that.getData(), function(i, item) {
                    var index = "无效坐标";
                    var point = item;
                    var count = 1;
                    if(item.lat){
                        point = item.lng+','+item.lat;
                        count = item.count;
                    }
                    if ("0.00000000,0.00000000" != point) {
                        point = point.split(',');
                        var pixel = that.map.pointToPixel(new BMap.Point(point[0], point[1]));
                        var imageData = context.getImageData(pixel.x - cx, pixel.y - cy, 1, 1);
                        var colorObj = new RGBColor($.makeArray(imageData.data));
                        var index = that.getAreaByColor(colorObj.toHex());
                        index = index + '区域';
                    }
                    if (obj[index]) {
                        obj[index] = obj[index] + count;
                    } else {
                        obj[index] = count;
                    }
                });
                that.fire('data-parse', [obj]);
            }
        },
        getMap: function() {
            return this.map;
        }
    });

    $.bmaparea = {};
    $.bmaparea.instance = function(mapId, map) {
        return new JBMapArea(mapId, map);
    }
}(jQuery));
