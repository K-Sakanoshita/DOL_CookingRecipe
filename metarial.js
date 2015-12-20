/* ------------------------------------------------------------------
	共通する変数の定義
------------------------------------------------------------------- */

var MetaX = 1;				// 交易品選択欄の列数
var MetaY = 15;				// 交易品選択欄の行数
var Metas = MetaX * MetaY	// 交易品選択欄の最大数

/* ------------------------------------------------------------------
	材料クラスの定義
------------------------------------------------------------------- */

// クラス本体
function Metarial(){
	this.MList = MetarialList();	// data.js内部の配列変数
	this.DNull = DataNull();		// data.js内の関数
}

// 所有交易品一覧の表示
Metarial.prototype.WriteSelectList = function(){

	var HTML = "<div class=\"Sidebar\">\n";
	var x = 0;
	var y = 0;
	var i = 0;

	for(y=1;y<=MetaY;y++){
		for(x=1;x<=MetaX;x++){
			num = "0" + String((y-1) * MetaX + x);
			num = "MetaAll" + num.substr(num.length - 2);
			HTML += "<select name=\"" + num + "\" style=\"width:88%;margin:4px 1px;padding:1px;\">\n";
			HTML += "<option selected value=\"" + this.DNull + "\">" + this.DNull + "</option>\n";
			for(i = 0 ; i < this.MList.length ; i++)
				if (this.MList[i].indexOf(this.DNull) != -1){
					if (i > 0){
						HTML += "</optgroup>\n";
					};
					HTML += "<optgroup label=\"" + this.MList[i] + "\">\n";
				}else{
					HTML += "\t<option value=\"" + this.MList[i] + "\">" + this.MList[i] + "</option>\n";
				};
			HTML += "</select><input type=\"button\" class=\"clear\" value=\" × \" onClick=\"ClearSelectItem(" + y + ")\">\n";
		};
		HTML +="<br />";
	};
	HTML += "</div>\n";
	document.getElementById("ItemList").innerHTML = HTML;
};

// リスト初期化
Metarial.prototype.ClearSelectList = function(){
	var i   = 0;
	var num = "";
	for(i=1;i<=Metas;i++){
		num = "0" + i;
		num = "MetaAll" + num.substr(num.length-2);
		document.MetaAllForm[num].selectedIndex = 0;
	}
	return;
}

// 選択したアイテムの消去
Metarial.prototype.ClearSelectItem	= function(num){

	var MName   = "";
	
	num   = "0" + num;
	num   = "MetaAll" + num.substr(num.length-2);
	MName = document.MetaAllForm[num].value;
	if (MName != this.DNull ){
		document.MetaAllForm[num].value = this.DNull;
	}
	return;
}

// リストを返す
Metarial.prototype.GetSelectList	= function(){
	
	var SelList = new Array();
	var i       = 0;
	var j       = 0;
	var num     = "";
	var MName   = "";

	for(i = 1 ; i <= Metas ; i++){
		num   = "0" + i;
		num   = "MetaAll" + num.substr(num.length-2);
		MName = document.MetaAllForm[num].value;
		if (MName != this.DNull){
			SelList[j++] = MName;
		};
	};
	return SelList.sort().uniq();
};

// リストに追加する
Metarial.prototype.SetSelectList	= function(MName){

	var num		= "";
	var SName	= "";

	// 最初に交易品一覧に合致しているか確認
	for(i = 0 ; i < this.MList.length ; i++){
		// 交易品一覧と合致していた場合
		if (this.MList[i] == MName){
			// 既にリストで選択済みでないか確認
			for(j = 1 ; j <= Metas ; j++){
				num   = "0" + j;
				num   = "MetaAll" + num.substr(num.length-2);
				SName = document.MetaAllForm[num].value;
				if (SName == MName ){
					alert ("指定した交易品はリストに含まれています。");
					return;
				}
			}
			// 空いている場所を探して入れる
			for(j = 1 ; j <= Metas ; j++){
				num   = "0" + j;
				num   = "MetaAll" + num.substr(num.length-2);
				SName = document.MetaAllForm[num].value;
				if (SName == this.DNull ){
					document.MetaAllForm[num].value = MName;
					return;
				}
			}

			alert ("交易品リストに空きがありません。");
			return;
		}
	}
	alert ("キーワードに一致した交易品はありません。");
	return;
}


