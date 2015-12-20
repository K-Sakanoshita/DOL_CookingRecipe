/* ------------------------------------------------------------------
  レシピクラスの定義
------------------------------------------------------------------- */

// アニメーションしながら「並び替え・絞り込み」(Filter)へ移動
function ScrolltoFilter(){
	var begin = new Date() - 0;
	var prev = 0;
	var term = 200;
	var x = document.documentElement.scrollLeft || document.body.scrollLeft;
	var y = ((document.documentElement.scrollTop || document.body.scrollTop) * -1) + Position.cumulativeOffset($('Filter'))[1];
	var id = setInterval(
	function(){
		var current = new Date() - begin;
		if (current > term){
			clearInterval(id);
			current = term;
		}
		var diff = current - prev;
		prev = current;
		window.scrollBy((diff / term) * x, (diff / term) * y);
	}, 10);
}

// Stringクラスの拡張(全て置き換え、前後の空白削除)
String.prototype.replaceAll = function (org, dest){  
  return this.split(org).join(dest);  
} 

String.prototype.trim = function() {
    return this.replace(/^[ ]+|[ ]+$/g, '');
}

// クラス本体
var Recipe = function (Mode){					// Mode:"Phone":スマホ / その他:PC
	this.Mode			= Mode;					// Modeを保存
	this.RList			= RecipeList();			// data.js内部の配列変数
	this.GList			= GetRecipeList();		// data.js内部の配列変数
	this.Icons			= IconFileName();		// data.js内部の配列変数
	this.search_word	= "";					// 検索キーワード保持用
	this.FList			= new Array();			// 検索結果リストの保存場所
	this.DNull			= DataNull();			// data.js内の関数
	this.RLen			= RecipeLength();		// data.js内の関数
	this.RTitle			= RecipeTitle(Mode);	// data.js内の関数
	this.NoticeSort 	= NoticeSort();			// data.js内の関数
	this.RecipeVisible	= "on";					// レシピ帳の表示有無
	this.HTML			= "";					// 検索結果用のHTML
};

// アイコンファイル名検索(Recipeクラス)
Recipe.prototype.icon_file = function(icon_name) {
	if (!this.Icons[icon_name]){
		return "noimage"
	}
	return this.Icons[icon_name]
}

// 単品検索メゾッド
// 入力:MetaName 検索キーワード(半角空白区切りで複数or検索機能も有り)
// 入力:SType 完全一致(full)か部分一致(part)かの選択
// 注意:検索結果はFListには入りません。呼び出し元が設定する必要あり。
Recipe.prototype.SearchOne   = function (MetaName,SType){

	var rn    = new Array();	// レシピ内容の配列変数
	var mn    = new Array();	// 検索ワードの配列変数
	var RName = new Array();	// レシピ内容("("から左抜きだし)
	var SList = new Array();	// 検索結果の保存リスト(SingleList)
	var FCnt  = 0;

	var mn = MetaName.replaceAll("　"," ").trim()		// 全角空白→半角、前後の空白削除
	mn = mn.split(" ").sort().uniq();					// 空白で区切って、並び替えてまとめる

	for(var MCnt = 0 ; MCnt < mn.length ; MCnt++ ){	// 検索キーワード数だけ繰り返す
		switch (SType){
		case "full": // 完全一致検索
			for(var i=0 ; i < this.RList.length ; i++ ){
				rn = this.RList[i].split(",");
				for(var j =0 ; j < this.RLen ; j++ ){
					if (rn[j] != this.DNull){
						RName = rn[j].split("(");
						if (RName[0] == mn[MCnt]){
							SList[FCnt++] = this.RList[i];
							j = this.RLen;	// ループ終了
						};
					};
				};
			};
			break;
	
		case "part": // 部分一致検索
			for(var i=0 ; i < this.RList.length ; i++ ){
				rn = this.RList[i].split(",");
				for(var j =0 ; j < this.RLen ; j++ ){
					if (rn[j] != this.DNull){
						RName = rn[j].split("(");
						if (RName[0].indexOf(mn[MCnt]) != -1){
							SList[FCnt++] = this.RList[i];
							j = this.RLen;			// ループ終了
						};
					};
				};
			};
			break;
		};
	};

	this.search_word	= MetaName;
	return SList.uniq();
	
};

// 複合検索メゾッド(入力:材料リスト)
Recipe.prototype.SearchAll	= function(MList,SType){

	var TList	= new Array();
	var Found	= 0;

	// MListのゴミ削除とソート
	for (i = 1 ; i < MList.length ; i++){
		if ( MList[i] == this.DNull )
			MList[i] = Null;
	};
	MList = MList.sort();
	MList = MList.uniq();
	this.FList = [];

	switch (SType) {
	case "or":
		for(i = 0 ; i < MList.length ; i++){
			if((MList[i]!=null) && (MList[i] != this.DNull))
				this.FList = this.FList.concat(this.SearchOne(MList[i],"full"));
		};
		this.FList = this.FList.uniq();
		break;
	case "and":
		this.FList = this.SearchOne(MList[0],"full");		// 最初の材料で検索して結果リストに入れる
		for( i = 1 ; i < MList.length ; i++ ){				// 材料リストの個数だけループ
			TList = this.SearchOne(MList[i],"full");		// 新しい材料で検索して仮リストに入れる
			for( j = 0 ; j < this.FList.length ; j++ ){		// 結果リストの個数だけループ
				Found = 0;									// 発見フラグを初期化
				for( k = 0 ; k < TList.length ; k++ ){		// 仮リストの個数だけループ
					if ( this.FList[j] == TList[k] ){		// 仮リストと結果リストの両方にあれば
						Found = 1;							// and条件をクリアしたフラグを付ける
						k = TList.length;					// ループ処理を終わらせる
					};
				};
				if(Found == 0){								// 発見フラグが立たなかった場合
					this.FList.splice(j--,1);				// 結果リストから削除して、検索やり直し
				};
			};
		};
		break;
	};

	this.search_word = MList.join("、")
	return this.FList;
};

// ソート処理(入力:ソート対象、ソート順)
Recipe.prototype.SortResults = function(Target,SType){
	switch (Target){
	case "HP":
		this.FList = this.FList.sort(Sort_Comp_HP);
		break;
	case "Rank":
		this.FList = this.FList.sort(Sort_Comp_Rank);
		break;
	default:
		this.FList = this.FList.sort(Sort_Comp_Normal);
		break;
	};

	switch (SType) {
	case "desc":
		this.FList = this.FList.reverse();
		break;
	default:	// "asc"などはこちら
		break;
	};
	return;
}

// 通常ソート(レシピ帳、Rank、レシピ名)
function Sort_Comp_Normal(a,b){

	var AList = new Array();
	var BList = new Array();
	var Comp6 = 0;

	AList = a.split(",");
	BList = b.split(",");
	Comp6 = parseInt(AList[6]) - parseInt(BList[6]);

	if (AList[0] < BList[0]){ return -1 };
	if (AList[0] > BList[0]){ return  1 };
	if (Comp6 < 0){	return -1 };
	if (Comp6 > 0){	return  1 };
	if (AList[1] < BList[1]){ return -1 };
	if (AList[1] > BList[1]){ return  1 };
	return 0;
};

// Rankソート(Rank、レシピ名) ※レシピ帳は無視
function Sort_Comp_Rank(a,b){

	var AList = new Array();
	var BList = new Array();
	var Comp6 = 0;

	AList = a.split(",");
	BList = b.split(",");
	Comp6 = parseInt(AList[6]) - parseInt(BList[6]);

	if (Comp6 < 0){	return -1 };
	if (Comp6 > 0){	return  1 };
	if (AList[1] < BList[1]){ return -1 };
	if (AList[1] > BList[1]){ return  1 };
	return 0;
};

// HPソート(HP、Rank、レシピ名) ※レシピ帳は無視
function Sort_Comp_HP(a,b){

	var AList = new Array();	// 検索結果の保存リスト(SingleList)
	var BList = new Array();	// テンポラリの保存リスト
	var Comp8 = 0;
	var Comp6 = 0;

	AList = a.split(",");
	BList = b.split(",");
	Comp8 = parseInt(AList[8]) - parseInt(BList[8]);
	Comp6 = parseInt(AList[6]) - parseInt(BList[6]);

	if (Comp8 < 0){	return -1 };
	if (Comp8 > 0){	return  1 };
	if (Comp6 < 0){	return -1 };
	if (Comp6 > 0){	return  1 };
	if (AList[1] < BList[1]){ return -1 };
	if (AList[1] > BList[1]){ return  1 };
	return 0;
};

// HTML書き出しメゾット(入力:書き出し先Object、レシピ帳の表示有無、絞り込む種類、回復量のしきい値)
// ※Refineはcheckbox object。Actionは回復量のしきいとなる数字)
// ※絞り込みと書いてあるが、実際は"指定した種類を含む"処理となる。
Recipe.prototype.WriteAns	= function(Answer,RType,Refine,Action){

	var TList  = new Array();		// 結果リスト内の一行(レシピ情報)
	var TListS = new Array();		// レシピ情報内の11列目(種類)
	var MName  = new Array();
	var RfList = new Array();		// Refine(絞り込む種類)の配列化
	var OTitle = "";				// レシピ帳の名前(OldTitle)
	var i      = 0;
	var j      = 0;

	this.HTML	= search_header(this.Mode,this.search_word);	// 検索キーワードの表示

	if (this.FList == ""){							// 結果リストが存在しない場合
		Answer.innerHTML = this.HTML;
		return;
	};

	if (RType == "inherit"){						// ソート情報の確認と内部設定への反映
			RType = this.RecipeVisible;
	}else{
		this.RecipeVisible = RType;
	};

	if (RType == "off" && this.Mode != "Phone" ){
			this.HTML += this.NoticeSort;
	};

	for (i = 0; i < Refine.length; i++) {			// フォームでチェックされた項目をRfListへ
		if (Refine[i].checked) {
			RfList[j++] = Refine[i].value
		};
	};

	for(i = 0 ; i < this.FList.length ; i++){		// 結果リストの数だけ繰り返す
		TList = this.FList[i].split(",");				// レシピ情報を取り出して配列化
		TListS = TList[10].split("/");					// レシピ情報の11列目(種類)を取り出す(/区切り)
		if ((Action == "00") ||							// 行動力回復の絞り込み
			(Action == "59" && (parseInt(TList[8]) <= 59 )) ||
			(Action == "60" && (parseInt(TList[8]) >= 60 )) ){
			for (j = 0 ; j < TListS.length ; j++){			// 種類(レシピ情報)の数だけ繰り返す
				if (RfList.indexOf(TListS[j]) != -1){		// checkboxで選択されていたら
					if (this.Mode == "Phone") {
						OTitle = this.MakeAnsLine_Phone(TList,OTitle);	// 粛々とHTMLの生成を行う
					}else{
						OTitle = this.MakeAnsLine_PC(TList,OTitle);		// 粛々とHTMLの生成を行う
					}
					j = TListS.length;							// 一つでもあればループ終了
				};
			};
		 };
	};
	this.HTML += "</table>";
	Answer.innerHTML = this.HTML;
	return;
};

// HTMLの一行分を生成する関数(R_WriteAnswerの内部処理)
// 入力:TList(レシピデーター),OTitle:レシピ帳の名前(OldTitle)
// 出力:this.HTMLにHTML生成結果。関数の返りにOTitle。
Recipe.prototype.MakeAnsLine_PC = function(TList,OTitle){

	Material       = new Array(3);

	// レシピ帳,レシピ名,完成品(料理名),材料1(数),材料2(数),材料3(数),Rank,生産量,行動回復,疲労回復,種類,その他
	var BinderName = TList[0];
	var RecipeName = TList[1];
	var FinishName = TList[2];
	Material[0]    = TList[3];
	Material[1]    = TList[4];
	Material[2]    = TList[5];
	var Rank       = TList[6];
	var Volume     = TList[7];
	var Recovery   = TList[8];
	var Fatigue    = TList[9];
	var Category   = TList[10];
	var Etc        = TList[11];
	var MetaHTML   = "";
	var RankHTML   = "";

	// レシピ帳の表示/非表示
	switch (this.RecipeVisible) {
	case "on":
		if (OTitle != BinderName){
			if (OTitle != ""){	// 最初以外は後処理
				this.HTML += "</table><hr>\n";
			};
			this.HTML += "<h4><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + BinderName + "');ScrolltoFilter();\">" + BinderName + "</a></h4>";
			this.HTML += "<div id=\"h4-right\"> / 入手場所:" + this.GList[BinderName] + "</div>\n" + this.RTitle;	// レシピ帳のタイトルを表示させてからテーブル開始
		};
		break;
	case "off":
		if (OTitle == ""){
			this.HTML += this.RTitle;
		};
		break;
	};

	this.HTML += "<tr>";
	OTitle = BinderName;

	// 完成品アイコンの表示
	this.HTML += "<td class=\"Icon\">";
	this.HTML += "<img class=\"Icon\" src=\"./icon/" + Recipe.icon_file(FinishName) + ".png\">"
	this.HTML += "</td>";

	// 完成品とレシピ名の表示
	if (this.RecipeVisible == "on") {	// レシピ帳表示"on"
		this.HTML += "<td><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + FinishName + "');ScrolltoFilter();\" >" + FinishName + "</a></td>";
		this.HTML += "<td><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + RecipeName + "');ScrolltoFilter();\" >" + RecipeName + "</a></td>";
	}else{								// レシピ帳表示"off"(ソート等)
		this.HTML += "<td><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + FinishName + "');ScrolltoFilter();\" title=\"レシピ帳：" + BinderName + "\">" + FinishName + "</a></td>";
		this.HTML += "<td><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + RecipeName + "');ScrolltoFilter();\" title=\"レシピ帳：" + BinderName + "\">" + RecipeName + "</a></td>";
	};

	// 材料の表示(3種類)
	MetaHTML = "";
	for (i = 0; i < 3; i++) {
		if(Material[i] != this.DNull){
			MName = Material[i].split("(");
			MetaHTML += "<td><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + MName[0] + "');ScrolltoFilter();\">" + Material[i] + "</a></td>";
		}else{
			MetaHTML += "<td>" + this.DNull + "</td>";
		}
	}
	this.HTML += MetaHTML;

	// ランク,生産量,行動回復,疲労回復,その他の表示
	RankHTML =  "<td class=\"Rank\">"		+ Rank     + "</td>" +
				"<td class=\"Volume\">"		+ Volume   + "</td>" +
				"<td class=\"Recovery\">"	+ Recovery + "</td>" +
				"<td class=\"Fatigue\">"	+ Fatigue  + "</td>";

	this.HTML += RankHTML + "<td>" + Etc + "</td></tr>\n";
	return OTitle;
};

// HTMLの一行分を生成する関数(R_WriteAnswerの内部処理)
// 入力:TList(レシピデーター),OTitle:レシピ帳の名前(OldTitle)
// 出力:this.HTMLにHTML生成結果。関数の返りにOTitle。
Recipe.prototype.MakeAnsLine_Phone = function(TList,OTitle){

	Material       = new Array(3);

	// レシピ帳,レシピ名,完成品(料理名),材料1(数),材料2(数),材料3(数),Rank,生産量,行動回復,疲労回復,種類,その他
	var BinderName = TList[0];
	var RecipeName = TList[1];
	var FinishName = TList[2];
	Material[0]    = TList[3];
	Material[1]    = TList[4];
	Material[2]    = TList[5];
	var Rank       = TList[6];
	var Volume     = TList[7];
	var Recovery   = TList[8];
	var Fatigue    = TList[9];
	var Category   = TList[10];
	var Etc        = TList[11];
	var MetaHTML   = "";
	var RankHTML   = "";

	// レシピ帳の表示/非表示
	switch (this.RecipeVisible) {
	case "on":
		if (OTitle != BinderName){
			if (OTitle != ""){	// 最初以外は後処理
				this.HTML += "</table><hr>\n";
			};
			this.HTML += "<h4><a href=\"javascript:void(0)\" onclick=\"KeySearch('" + BinderName + "');ScrolltoFilter();\">" + BinderName + "</a></h4>";
			this.HTML += "<div id=\"h4-right\"><small> / 入手場所:" + this.GList[BinderName] + "</small></div>\n" 	// レシピ帳のタイトルを表示させてからテーブル開始
			this.HTML += "<table>"
		};
		break;
	case "off":
		if (OTitle == ""){
			this.HTML += "<table>";
		};
		break;
	};
	OTitle = BinderName;

	// テーブル1行目
	this.HTML += "<tr><td class=\"Icon\" rowspan=\"2\">";
	this.HTML += "<img class=\"Icon\" src=\"./icon/" + Recipe.icon_file(FinishName) + ".png\">"		// 完成品アイコンの表示
	this.HTML += "</td>\n";
	this.HTML += "<td class=\"Recipe\">";
	this.HTML += "<a href=\"javascript:void(0)\" onclick=\"KeySearch('" + RecipeName + "');ScrolltoFilter();\">" + RecipeName + "</a>";		// レシピ名の表示
	this.HTML += "</td></tr>\n";

	// テーブル2行目
	this.HTML += "<tr><td>";
	this.HTML += "<a href=\"javascript:void(0)\" onclick=\"KeySearch('" + FinishName + "');ScrolltoFilter();\">" + FinishName + "</a><br>";	// 完成品の表示

	this.HTML += "Rank:" + Rank + " / 生産:" + Volume + " / 回復:" + Recovery;	// ランク,生産量,回復の表示
	if ( Etc != "" ){
		this.HTML += " / " + Etc	// 備考の表示
	}
	this.HTML += "<br>";

	MetaHTML = "";
	for (i = 0; i < 3; i++) {	// 材料の表示(3種類)
		if(Material[i] != this.DNull){
			MName = Material[i].split("(");
			MetaHTML += "<a href=\"javascript:void(0)\" onclick=\"KeySearch('" + MName[0] + "');ScrolltoFilter();\">" + Material[i] + "</a>、";
		}else{
			MetaHTML += this.DNull;
		}
	}
	MetaHTML = MetaHTML.slice(0, -1);
	this.HTML += MetaHTML;
	this.HTML += "</td></tr>\n";

	return OTitle;
};

