
(function($) {    
    function JBMapCity(id, bdmap){
        if(!BMap || !$.cache || !id || !bdmap) {
            return false;
        }
        this.id = id;
        this.map = bdmap;
        this.mapCache = $.cache.instance(id+'_mapcity');
    }

    $.extend(JBMapCity.prototype, {
        c_cityId:null,
        c_cityName:null,
        on:function(event, cb){
            $(this).on(event, cb);
        },
        fire:function(event, data){
            $(this).trigger(event, data);
        },
        init: function(){
            var lastCity = this.mapCache.get('lastCity');
            if(lastCity){
                this.fire('last-city', [lastCity.cityId, lastCity.cityName]);
                this.showCity(lastCity.cityId, lastCity.cityName);
            }else{
                this.showCity(1, '北京');
            } 
            var that = this;      

            $(window).on('unload', function(){
                var cityData = {};
                cityData.point = that.map.getCenter();
                cityData.zoom = that.map.getZoom();
                that.mapCache.set(that.c_cityId, cityData);
                that.mapCache.set('lastCity', {
                    cityId:that.c_cityId,
                    cityName:that.c_cityName
                });
            })
        },
        showCity: function(cityId, cityName){
            var cityData,point,zoom, posInfo, lng, lat;

            if(this.c_cityId){
                if(cityId == this.c_cityId){
                    return false;
                }else{
                    cityData = {};
                    cityData.point = this.map.getCenter();
                    cityData.zoom = this.map.getZoom();
                    this.mapCache.set(this.c_cityId, cityData);
                }
            }

            var cityData = this.mapCache.get(cityId);

            if(cityData){
                point = cityData.point;
                zoom = cityData.zoom;
            }else if(window.MAPCOORD){
                var posInfo = window.MAPCOORD[cityName];
                if(posInfo){
                    var posInfoList = posInfo.split(',');
                    point = {};
                    point.lng = posInfoList[0];
                    point.lat = posInfoList[1];
                    zoom = 14;
                }else{
                    alert('找不到该城市的经纬度');
                    return false;
                }
            }
            this.c_cityName = cityName;
            this.c_cityId = cityId;
            this.map.centerAndZoom(new BMap.Point(point.lng,point.lat), zoom);
            this.fire('show-city', [this.c_cityId, this.c_cityName]);
        },
        getMap: function(){
            return this.map;
        }
    });

    $.bmapcity = {};
    $.bmapcity.instance = function(mapId, map){
        return new JBMapCity(mapId, map);
    }
    
}(jQuery));
