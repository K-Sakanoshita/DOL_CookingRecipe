// レシピクラスの定義
var Recipe = (function () {
	let search_word, RecipeBooks = [], Materials = [], Icons = {};

	return {
		master: (json) => {				// レシピ帳Jsonをセット or 返す
			if (json !== undefined) {	// データ形式:配列 レシビ帳名と入手は配列へ挿入
				Object.keys(json).forEach((bookname) => {
					let bookdata = { "book_name": bookname, "get": json[bookname].get };
					for (let key in json[bookname].list) {
						RecipeBooks.push(Object.assign(json[bookname].list[key], bookdata));
					};
				});
				Recipe.sort(RecipeBooks, "reset");
			}
			return RecipeBooks;
		},

		material: (json) => {
			if (json !== undefined) Materials = json;
			return Materials;
		},

		icon: function (json) {
			if (json !== undefined) Icons = json;
			return Icons;
		},

		icon_file: icon_name => {		// アイコンファイル名検索(Recipeクラス)
			return Icons[icon_name] == undefined ? "noimage" : Icons[icon_name];
		},

		// 検索メゾッド
		// 入力:keywords 検索キーワード(半角空白区切りで複数or検索機能も有り)
		search: function (keywords) {
			let MList = [];				// 検索ワードの配列変数
			let FList = {};		// 検索結果の保存リスト
			FList = JSON.parse(JSON.stringify(RecipeBooks));

			if (keywords == undefined) keywords = "";
			search_word = keywords;

			MList = keywords.split("　").join(" ").replace(/^[ ]+|[ ]+$/g, '');		// 全角空白→半角、前後の空白削除
			MList = MList.split(" ");												// 並び替えてまとめる
			MList = Array.from(new Set(MList));										// ユニーク化

			for (let MCnt = 0; MCnt < MList.length; MCnt++) {	// 検索キーワード数だけ繰り返す
				let keyword = MList[MCnt];
				for (let idx in FList) {
					let data = FList[idx];
					let bookname = data.book_name;
					let texts = bookname + " " + data.product_name + " " + data.recipe_name +
						" " + data.item1_name + " " + data.item2_name + " " + data.item3_name;
					if (texts.indexOf(keyword) == -1) {				// 検索に引っかからない場合
						delete FList[idx];			// 削除
					};
				};
			};
			return FList;
		},

		// ソート処理(入力:ソート対象、ソート順)
		sort: function (FList, mode) {
			let params = mode.split('.');
			switch (params[0]) {
				case "HP":
					FList = FList.filter(a => parseInt(a.recovery) > 0);
					FList = FList.sort((a, b) => parseInt(a.recovery) < parseInt(b.recovery) ? -1 : 1);
					break;
				case "Rank":			// Rankソート(Rank)
					FList = FList.sort((a, b) => parseInt(a.req_rank1) < parseInt(b.req_rank1) ? -1 : 1);
					break;
				default:				// 通常ソート(レシピ帳、Rank、レシピ名)
					FList = FList.sort((a, b) => a.recipe_name > b.recipe_name ? -1 : 1);
					FList = FList.sort((a, b) => parseInt(a.req_rank1) < parseInt(b.req_rank1) ? -1 : 1);
					FList = FList.sort((a, b) => a.book_name < b.book_name ? -1 : 1);
					break;
			};
			switch (params[1]) {
				case "desc":
					FList = FList.reverse();
					break;
				default:	// "asc"などはこちら
					break;
			};
			return FList;
		},

		// HTML書き出しメゾット
		write: function (FList, slist) {
			let HTML = "", old_book = "", data = [];
			let mobile = window.innerWidth >= 768 ? false : true;						// 768以上はPC。他はモバイル

			document.getElementById('result').textContent = '';
			if (search_word !== "") HTML = "<h2>" + search_word + "の検索結果</h2>";	// 検索キーワード

			switch (slist) {
				case true:	// ソート時
					Object.keys(FList).forEach(idx => data.push(FList[idx]));
					break;
				case false:	// 非ソート時
					Object.keys(FList).forEach(idx => {
						if (FList[idx].book_name !== old_book && old_book !== "") {		// レシピ帳名変更&初期以外
							HTML += write_table({ "data": data, "sort": slist, "mobile": mobile });		// HTML生成を行う
							data = [];						// データ初期化
						}
						data.push(FList[idx]);				// データ追加
						old_book = FList[idx].book_name;	// 変化チェック用変数へレシピ帳名を保管
					});
					break;
			};
			if (data.length > 0) HTML += write_table({ "data": data, "sort": slist, "mobile": mobile });	// HTML生成を行う
			document.getElementById("result").insertAdjacentHTML('afterbegin', HTML);
			return;

			// 1テーブルを生成する関数(writeの内部処理)
			// 入力:params / 出力:HTMLにHTML生成結果
			function write_table(params) {
				let HTML = "", data;

				if (!params.sort && params.mobile) {			// 非ソート&モバイル時はレシピ帳のタイトルを表示
					data = params.data[0];
					HTML += "<hr>\n<h3><a onclick=\"Cooking.search('" + data.book_name + "');\">" + data.book_name + "</a><br>";
					HTML += "<span class='get'>入手:" + data.get + "</span></h3>\n";
				}
				if (params.mobile || params.sort) {
					HTML += `<table>
								<colgroup><col class="s15"><col class="s55"><col class="s10"><col class="s10"><col class="s10"></colgroup>	
	  							<tr><th colspan="2">料理</th>
								<th>Rank</th>
								<th>数量</th>
								<th>行動</th></tr>\n`;				// テーブル開始
				} else {
					HTML += `<hr>\n<table>
								<colgroup><col class="s30"><col class="s10"><col class="s40"><col class="s10"><col class="s10"><col class="s10"></colgroup>	
								<tr><th>レシピ帳</th>
								<th colspan="2">料理</th>
								<th>Rank</th>
								<th>数量</th>
								<th>行動</th></tr>\n`;				// テーブル開始
				};

				Object.keys(params.data).forEach(idx => {
					data = params.data[idx];
					HTML += "<tr>"								// 1行目開始

					if (!params.sort && !params.mobile && idx == 0) {		// 非ソート&PC時&1行目はレシピ帳のタイトルを表示
						HTML += `<td rowspan="${params.data.length * 3}"><a onclick="Cooking.search('${data.book_name}');">${data.book_name}</a><br>`;
						HTML += "<span class='get'>入手:" + data.get + "</span></td>\n";
					}

					HTML += '<td class="icon" rowspan="3">';	// 完成品アイコンの表示
					// HTML += '<img class="icon" src="./icon/" + Recipe.icon_file(data.product_name) + ".png" onerror="this.onerror = null; this.src = \'./image/noimage.png\';">'
					HTML += `<img class="icon" src="./icon/${Recipe.icon_file(data.product_name)}.png">`;
					HTML += '</td>';
					HTML += `<td colspan="4"><a onclick="Cooking.search('${data.product_name}');">${data.product_name}</a>`;		// 完成品とレシピ名の表示
					HTML += '<span class="recipe"> / レシピ名: <a onclick="Cooking.search(\'' + data.recipe_name + '\');">' + data.recipe_name + '</a></span></td>';
					HTML += '</tr>\n<tr>';						// 1行目終了&2行目開始

					let MateHTML = "材料: ";					// 材料の表示
					let item_name = [data.item1_name, data.item2_name, data.item3_name];
					let item_rnum = [data.item1_reqnum, data.item2_reqnum, data.item3_reqnum];
					item_name.forEach((mkey, midx) => {
						if (mkey !== "") {
							let matename = mkey + "(" + item_rnum[midx] + ")";
							MateHTML += `<a onclick="Cooking.search('${mkey}');">${matename}</a>, `;
						};
					});
					HTML += "<td><span class='recipe'>" + MateHTML.slice(0, -2) + "</span></td>";
					HTML += `<td class="Rank">${data.req_rank1}</td><td class="Volume">${data.created}</td><td class="Recovery">${data.recovery}</td>`;					// ランク,生産量,行動回復,疲労回復,その他の表示
					HTML += '</tr>\n<tr>';	// 2行目終了&3行目開始

					HTML += `<td colspan="5"><span class="recipe">備考: ${data.memo}</span></td>`;
					HTML += '</tr>\n';	// 3行目終了

				});
				HTML += '</table>\n';	// テーブル終了
				return HTML;
			}
		}
	};
})();

