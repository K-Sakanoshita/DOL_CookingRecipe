// Display Status
var Display = (function () {
    return {
        add_select: (domid, text, value) => {
            let option = document.createElement("option");
            option.text = text;
            option.value = value;
            document.getElementById(domid).appendChild(option);
        },
        clear_select: (domid) => {
            $('#' + domid + ' option').remove();
            $('#' + domid).append($('<option>').html("---").val("-"));
        },// アニメーションしながら「並び替え・絞り込み」(Filter)へ移動
        ScrollTop: function () {
            let begin = new Date() - 0;
            let prev = 0;
            let term = 200;
            let x = document.documentElement.scrollLeft || document.body.scrollLeft;
            let y = ((document.documentElement.scrollTop || document.body.scrollTop) * -1);
            let id = setInterval(() => {
                let current = new Date() - begin;
                if (current > term) {
                    clearInterval(id);
                    current = term;
                    let keyfld = document.getElementById("keywords");
                    keyfld.focus();
                    keyfld.setSelectionRange(keyfld.value.length, keyfld.value.length);
                }
                let diff = current - prev;
                prev = current;
                window.scrollBy((diff / term) * x, (diff / term) * y);
            }, 10);
        }
    };
})();
