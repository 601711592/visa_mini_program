import {defineStore} from 'pinia';
import {getGoodsList,getShopCagetorys,type Goods,type GoodsCategory} from '@/services/shop';
import {MALL_PREVIEW} from '@/mall/config';import {demoGoods,categories} from '@/mall/fixtures';
/** 复用既有商品读取接口；显式演示模式下仅使用内存数据。 */
export const useCatalogStore=defineStore('catalog',{
 state:()=>({goods:[] as Goods[],categories:[] as GoodsCategory[],loading:false,loaded:false,error:'',homeCategory:0,selectedCategory:0}),
 actions:{async load(force=false){if(this.loading||(this.loaded&&!force))return;this.loading=true;this.error='';try{
 if(MALL_PREVIEW){this.goods=demoGoods();this.categories=categories.map(c=>({...c}));}else{const [c,g]=await Promise.all([getShopCagetorys(),getGoodsList({pageSize:100})]);this.categories=c.data;this.goods=g.data.data;}
 if(!this.categories.some(c=>c.id===this.homeCategory))this.homeCategory=this.categories[0]?.id||0;
 if(!this.categories.some(c=>c.id===this.selectedCategory))this.selectedCategory=this.categories[0]?.id||0;this.loaded=true;
 }catch(e){this.error=e instanceof Error?e.message:'商品加载失败，请重试';}finally{this.loading=false;}}}
});
