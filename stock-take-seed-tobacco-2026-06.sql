-- Roberto's — FOH Stock Take SEED: TOBACCO, June 2026 (48 items)
-- Generated from "Stock Take List -R's Tobacco.xls". Run AFTER stock-take-schema.sql, in the FOH project (paoaivwtkzujmrgrfjuq).
-- Idempotent: clears this venue/dept/month first, then re-inserts. Safe to re-run.

delete from stock_take_counts where venue_id='robertos-difc' and dept='tobacco' and month='2026-06';
delete from stock_take_items  where venue_id='robertos-difc' and dept='tobacco' and month='2026-06';
delete from stock_take_sheets where venue_id='robertos-difc' and dept='tobacco' and month='2026-06';

insert into stock_take_sheets (venue_id,dept,month,status,source_filename,item_count,uploaded_by_name) values
  ('robertos-difc','tobacco','2026-06','counting','Stock Take List -R''s Tobacco.xls',48,'seed');

insert into stock_take_items (venue_id,dept,month,item_group,code,name,unit,price,units,sort_order) values
  ('robertos-difc','tobacco','2026-06','Cigar','5010002','A Fuente Ffox 2020 Sol DAmor [1x20] -18620202','Pkt/1x20 Pcs',6478,'[{"unit":"Pkt/1x20 Pcs","price":6478},{"unit":"Each","price":323.9}]'::jsonb,1),
  ('robertos-difc','tobacco','2026-06','Cigar','5010003','A Fuente Hem Masterpiece [1X10] -18610410','Pkt/1x10 Pcs',1868,'[{"unit":"Pkt/1x10 Pcs","price":1868},{"unit":"Each","price":186.8}]'::jsonb,2),
  ('robertos-difc','tobacco','2026-06','Cigar','5010004','Bolivar Gold Medal LCDH Exclusive (1x10Pcs)','Pkt/1x10 Pcs',3600,'[{"unit":"Pkt/1x10 Pcs","price":3600},{"unit":"Each","price":360}]'::jsonb,3),
  ('robertos-difc','tobacco','2026-06','Cigar','5010077','Chazaro Black Cigar (1x25)','Box/1x25 Pcs',3250,'[{"unit":"Box/1x25 Pcs","price":3250},{"unit":"Each","price":130}]'::jsonb,4),
  ('robertos-difc','tobacco','2026-06','Cigar','5010070','EL Cohiba, Siglo I, Petit Corona','Each',128,'[{"unit":"Each","price":128}]'::jsonb,5),
  ('robertos-difc','tobacco','2026-06','Cigar','5010069','EL Cohiba, Siglo VI, Robusto Extra','Each',464,'[{"unit":"Each","price":464}]'::jsonb,6),
  ('robertos-difc','tobacco','2026-06','Cigar','5010075','EL E.P. Carrillo, Allegiance, Confident Toro','Each',80,'[{"unit":"Each","price":80}]'::jsonb,7),
  ('robertos-difc','tobacco','2026-06','Cigar','5010074','EL E.P. Carrillo, Endure, Toro','Each',104,'[{"unit":"Each","price":104}]'::jsonb,8),
  ('robertos-difc','tobacco','2026-06','Cigar','5010072','EL E.P. Carrillo, La Historia, Dona Elena Toro','Each',80,'[{"unit":"Each","price":80}]'::jsonb,9),
  ('robertos-difc','tobacco','2026-06','Cigar','5010073','EL E.P. Carrillo, Pledge, Sojourn Toro','Each',80,'[{"unit":"Each","price":80}]'::jsonb,10),
  ('robertos-difc','tobacco','2026-06','Cigar','5010046','EL Hemingway Signature Maduro, Perfecto','Each',216,'[{"unit":"Each","price":216}]'::jsonb,11),
  ('robertos-difc','tobacco','2026-06','Cigar','5010065','EL La Aurora, 1903 Edition, 120th Anniversay, Toro','Each',112,'[{"unit":"Each","price":112}]'::jsonb,12),
  ('robertos-difc','tobacco','2026-06','Cigar','5010064','EL La Aurora, 1903 Edition, Preferidos Corojo Gold, Perfecto','Each',176,'[{"unit":"Each","price":176}]'::jsonb,13),
  ('robertos-difc','tobacco','2026-06','Cigar','5010049','EL Limited Edition, Kolosso White, Toro Gordo','Each',384,'[{"unit":"Each","price":384}]'::jsonb,14),
  ('robertos-difc','tobacco','2026-06','Cigar','5010048','EL Limited Edition, The 7 Collection 777, Short Robusto','Each',88,'[{"unit":"Each","price":88}]'::jsonb,15),
  ('robertos-difc','tobacco','2026-06','Cigar','5010047','EL Montecristo Linea 1935, Dumas','Each',264,'[{"unit":"Each","price":264}]'::jsonb,16),
  ('robertos-difc','tobacco','2026-06','Cigar','5010076','EL Padron Serie 1964','Each',260,'[{"unit":"Each","price":260}]'::jsonb,17),
  ('robertos-difc','tobacco','2026-06','Cigar','5010071','EL Serie V 135th Anniversary','Each',144,'[{"unit":"Each","price":144}]'::jsonb,18),
  ('robertos-difc','tobacco','2026-06','Cigar','5010050','EL The Alexandra Collection, Coco, Robusto Extra','Each',168,'[{"unit":"Each","price":168}]'::jsonb,19),
  ('robertos-difc','tobacco','2026-06','Cigar','5010063','EL The Culinary Art Collection, Italy Toscana, Toro','Each',116,'[{"unit":"Each","price":116}]'::jsonb,20),
  ('robertos-difc','tobacco','2026-06','Cigar','5010062','EL The Emperor Collection, Alexander III Maduro, Toro','Each',128,'[{"unit":"Each","price":128}]'::jsonb,21),
  ('robertos-difc','tobacco','2026-06','Cigar','5010061','EL The Emperor Collection, Empress Sheba, Toro Gordo','Each',176,'[{"unit":"Each","price":176}]'::jsonb,22),
  ('robertos-difc','tobacco','2026-06','Cigar','5010045','EL The Emperor Collection, Yao Maduro Maduro, Gordo Torpedo','Each',192,'[{"unit":"Each","price":192}]'::jsonb,23),
  ('robertos-difc','tobacco','2026-06','Cigar','5010057','EL The Luxus Collection, Flamingo Amarillo, Robusto Short','Each',152,'[{"unit":"Each","price":152}]'::jsonb,24),
  ('robertos-difc','tobacco','2026-06','Cigar','5010058','EL The Luxus Collection, Precioso Pink, Petit Panetela','Each',120,'[{"unit":"Each","price":120}]'::jsonb,25),
  ('robertos-difc','tobacco','2026-06','Cigar','5010056','EL The Luxus Collection, Rebelde Blue, Robusto Extra','Each',224,'[{"unit":"Each","price":224}]'::jsonb,26),
  ('robertos-difc','tobacco','2026-06','Cigar','5010059','EL The Luxus Collection, Small Impact Green, Mini Gordo','Each',136,'[{"unit":"Each","price":136}]'::jsonb,27),
  ('robertos-difc','tobacco','2026-06','Cigar','5010055','EL The Sacred Art Collection, Da Vinci, Lancero','Each',168,'[{"unit":"Each","price":168}]'::jsonb,28),
  ('robertos-difc','tobacco','2026-06','Cigar','5010054','EL The Sacred Art Collection, Raphael, Toro','Each',128,'[{"unit":"Each","price":128}]'::jsonb,29),
  ('robertos-difc','tobacco','2026-06','Cigar','5010060','EL The Travel Time Collection, Dubai, Robusto','Each',128,'[{"unit":"Each","price":128}]'::jsonb,30),
  ('robertos-difc','tobacco','2026-06','Cigar','5010053','EL The Zaya Collecion, Excepcion Esmeralda, Robusto Gordo','Each',308,'[{"unit":"Each","price":308}]'::jsonb,31),
  ('robertos-difc','tobacco','2026-06','Cigar','5010051','EL The Zaya Collection, Bomba Orange, Gordo','Each',336,'[{"unit":"Each","price":336}]'::jsonb,32),
  ('robertos-difc','tobacco','2026-06','Cigar','5010052','EL The Zaya Collection, Bullet Black, Short Robusto','Each',152,'[{"unit":"Each","price":152}]'::jsonb,33),
  ('robertos-difc','tobacco','2026-06','Cigar','5010068','EL Trinidad, Coloniales, Corona','Each',184,'[{"unit":"Each","price":184}]'::jsonb,34),
  ('robertos-difc','tobacco','2026-06','Cigar','5010067','EL Trinidad, Esmeralda, Robusto','Each',304,'[{"unit":"Each","price":304}]'::jsonb,35),
  ('robertos-difc','tobacco','2026-06','Cigar','5010066','EL Trinidad, Fundadores, Lancero','Each',328,'[{"unit":"Each","price":328}]'::jsonb,36),
  ('robertos-difc','tobacco','2026-06','Cigar','5010007','EPC New Wave Reserva Robusto (1x20Pcs) -3310407','Pkt/1x20 Pcs',1901,'[{"unit":"Pkt/1x20 Pcs","price":1901},{"unit":"Each","price":95.05}]'::jsonb,37),
  ('robertos-difc','tobacco','2026-06','Cigar','5010026','Partagas Serie D-4 (1x25) -16245201','Pkt/1x25 Pcs',2500,'[{"unit":"Pkt/1x25 Pcs","price":2500},{"unit":"Each","price":100}]'::jsonb,38),
  ('robertos-difc','tobacco','2026-06','Cigar','5010035','RP Decade Short Robusto 4 x54 (1x20Pcs) -12510221','Pkt/1x20 Pcs',1493.4,'[{"unit":"Pkt/1x20 Pcs","price":1493.4},{"unit":"Each","price":74.67}]'::jsonb,39),
  ('robertos-difc','tobacco','2026-06','Cigar','5010031','Relx Infinity Pod Double Apple -6971808588110','Each',50,'[{"unit":"Each","price":50}]'::jsonb,40),
  ('robertos-difc','tobacco','2026-06','Cigar','5010032','Relx Infinity Pod Golden Slice -6972890393323','Each',50,'[{"unit":"Each","price":50}]'::jsonb,41),
  ('robertos-difc','tobacco','2026-06','Cigar','5010033','Relx Infinity Pod Tangy Purple -6971808588103','Each',50,'[{"unit":"Each","price":50}]'::jsonb,42),
  ('robertos-difc','tobacco','2026-06','Cigar','5010040','Sancho Panza Homeros (Greek Regional  Edition)','Each',240,'[{"unit":"Each","price":240}]'::jsonb,43),
  ('robertos-difc','tobacco','2026-06','Cigar','5010044','V Double Robusto 10 (1x10Pcs) -6298044137026','Pkt/1x10 Pcs',1200,'[{"unit":"Pkt/1x10 Pcs","price":1200},{"unit":"Each","price":120}]'::jsonb,44),
  ('robertos-difc','tobacco','2026-06','Cigarettes','5011002','Marlboro Double Ice (1x10Pkt)','Pkt/1x10 Pcs',221.14,'[{"unit":"Pkt/1x10 Pcs","price":221.14},{"unit":"Each","price":22.11}]'::jsonb,45),
  ('robertos-difc','tobacco','2026-06','Cigarettes','5011003','Marlboro Double Mix (1x10Pkt)','Pkt/1x10 Pcs',222,'[{"unit":"Pkt/1x10 Pcs","price":222},{"unit":"Each","price":22.2}]'::jsonb,46),
  ('robertos-difc','tobacco','2026-06','Cigarettes','5011001','Marlboro Gold (1x10Pkt)','Pkt/1x10 Pcs',222,'[{"unit":"Pkt/1x10 Pcs","price":222},{"unit":"Each","price":22.2}]'::jsonb,47),
  ('robertos-difc','tobacco','2026-06','Cigarettes','5011004','Marlboro Red (1x10Pkt)','Pkt/1x10 Pcs',222,'[{"unit":"Pkt/1x10 Pcs","price":222},{"unit":"Each","price":22.2},{"unit":"","price":0},{"unit":"","price":0}]'::jsonb,48);
