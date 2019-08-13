function Lucky(container,data,options) {
    if(!container){
        return false;
    }
    if(!data.length){
        return false;
    }

    let opt = Object.assign({},{
        childHeight: 200, // 子节点的高度
        childRender: null, // 渲染子节点的自定义函数
        speed: 16, // 运动的速度,帧与帧的间隔
        noCss3: false, // 不使用css3进行变换
        startIndex: 0, // 初始位置
        end: null // 抽奖结束后的回调函数
    },options);

    let childHeight = opt.childHeight;
    let originHeight = data.length * childHeight;
    let childRender = typeof opt.childRender == 'function' ? opt.childRender : function (item) {
        return '<li>'+item+'</li>';
    }

    let moving = false;
    let nowTop = - childHeight * (opt.startIndex || Math.floor(data.length / 2));
    let speed = opt.speed;


    init();

    function init(){
        renderChild();
        setTop();
    }

    function renderChild() {
        // 填充数据
        var c = '';
        for (let i = 0; i < data.length; i++) {
            c += childRender(data[i]);
        }
        container.innerHTML = c;
        // 复制节点，用于循环展示
        container.innerHTML += container.innerHTML;
    }

    let step = (function () {
        let max = 50;
        let min = 1;
        let maxAc = 0.2;
        let minAc = 0.1;
        let status = ''; // starting running ending
        let acceleration =  minAc; // 加速度
        let value = min;

        let endCallback = null;

        function now() {
            if(status == 'running'){
                return value;
            }else if(status == 'starting'){
                if(value >= max){
                    status = 'running';
                    value = max;
                    return value;
                }
                value += acceleration;
            }else if(status == 'ending'){
                if(value <= min){
                    (typeof endCallback == 'function') && endCallback();
                    endCallback = null;
                    value = min;
                    return value;
                }
                value -= acceleration;
            }
            return value;
        }

        function reset(){
            endCallback = null;
            value = min;
            status = '';
            acceleration = minAc;
        }

        return {
            now: now,
            start: function () {
                reset();
                status = 'starting';
            },
            end: function (callback) {
                status = 'ending';
                acceleration = maxAc;
                callback && (endCallback = callback);
            }
        }
    })();

    function updatePosition() {
        nowTop = Math.abs(nowTop) >= originHeight ? 0 : nowTop - step.now();
        setTop();
    }

    function setTop(){
        if(opt.noCss3){
            container.style.top = nowTop +'px';
        }else{
            container.style.transform = 'translateY('+nowTop +'px)';
            container.style.webkitTransform = 'translateY('+nowTop +'px)';
        }
    }

    let timer = null;
    function move() {
        if(!moving) return;
        if(!timer) updatePosition();
        timer = setTimeout(function(){
            updatePosition();
            move();
        },speed);
    }

    function start( ) {
        if(moving) return;
        moving = true;
        step.start();
        move();
    }

    let stopping = false;
    function stop() {
        if(stopping) return;
        stopping = true;
        step.end(function () {
            clearTimeout(timer);
            afterStop();
        });
    }

    function afterStop() {
        if((Math.abs(nowTop) % childHeight) > 5){
            moving = true;
            if(!timer){
                updatePosition();
            }
            clearTimeout(timer);
            timer = setTimeout(function(){
                updatePosition();
                afterStop();
            },speed);
        }else{
            moving = false;
            stopping = false;
            rollEnd();
        }
    }

    function rollEnd() {
        let index = Math.floor(Math.abs(nowTop) / childHeight);
        index = index >= data.length ? 0 : index;
        var item = data[index];
        (typeof opt.end == 'function') && opt.end(item);
    }

    return {
        start: start,
        stop: stop,
        getStatus: function () {
            if(moving){
                return 'running';
            }else if(stopping){
                return 'stopping';
            }else{
                return 'waitting'
            }
        }
    }
}