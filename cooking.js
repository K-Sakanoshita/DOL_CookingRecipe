// Global変数の設定
const DNull = "---";
const FILES = ['data/material.json', 'data/icon.json', 'data/recipe.json', 'data/recipe_firenze.json','data/recipe_around.json'];
const SELECTS = [['ソート無し', 'reset'], ['行動力ソート(昇順)', 'HP.asc'], ['行動力ソート(降順)', 'HP.desc'], ['Rankソート(昇順)', 'Rank.asc'], ['Rankソート(降順)', 'Rank.desc']];
var timeout = 0;

$(document).ready(function () {
    let jqXHRs = [];
    for (let key in FILES) { jqXHRs.push($.get(FILES[key])) };
    $.when.apply($, jqXHRs).always(function () {
        let recipe = { ...arguments[2][0], ...arguments[3][0], ...arguments[4][0] };
        Recipe.material(arguments[0][0]);       // 材料データを設定
        Recipe.icon(arguments[1][0]);           // アイコンデータを設定
        Recipe.master(recipe);                  // レシピデータをセット
        let allq = GetAllQuery();
        let q = typeof allq['q'] !== "undefined" ? allq['q'] : "";
        Cooking.search(q);

        // キーワード検索機能
        let keyword = document.getElementById("keywords");
        keyword.addEventListener("input", (e) => {
            if (timeout > 0) {
                window.clearTimeout(timeout);
                timeout = 0;
            };
            timeout = window.setTimeout(() => Cooking.search($("#keywords").val()), 500);
        });
        let MList = Recipe.material();
        for (let key in MList) {
            Display.add_select('keyword_list', '', MList[key]);
        };

        // ソート機能
        for (let key in SELECTS) {
            Display.add_select('sort_list', SELECTS[key][0], SELECTS[key][1]);
        };
        let selsort = document.getElementById("sort_list");
        selsort.addEventListener('change', (e) => {
            let mode = e.target.value;
            Cooking.sort(mode);
        });
    });
});

var Cooking = (function () {

    var OldKey = "";    // 前回の検索キーワード
    var Flist = [];

    return {
        search: function (keyword) {    // 関数:キーワード検索(空の時は全レシピ表示)
            let keyid = document.getElementById("keywords");
            OldKey = keyid.value;
            Flist = Recipe.search(keyword);
            Recipe.write(Flist, false);
            keyid.value = keyword;
            document.getElementById('sort_list').selectedIndex = 0;
            keyword = keyword !== "" ? '?q=' + keyword : location.pathname;
            history.replaceState('', '', keyword);
            Display.ScrollTop();
        },
        back: function () {       // OldKeyで再検索
            Cooking.search(OldKey, false);
            Display.ScrollTop();
        },
        sort: function (mode) {
            let slist = Recipe.sort(Flist, mode);
            Recipe.write(slist, mode !== "reset");
            Display.ScrollTop();
        }
    }
})();


// 関数:全ての引数を連想配列に入力
function GetAllQuery() {
    var Query = new Array();
    var qtext = window.location.search.substring(1);
    var parms = qtext.split('&');
    for (var i = 0; i < parms.length; i++) {
        var pos = parms[i].indexOf('=');
        if (pos > 0) {
            var key = parms[i].substring(0, pos);
            var str = parms[i].substring(pos + 1);
            str = decodeURIComponent(str);
            Query[key] = str;
        };
    };
    return Query;
};
