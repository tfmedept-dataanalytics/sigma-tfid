-- =====================================================================
-- SIGMA - data seed 2: nilai per tahun untuk OPI dan PPI (461 baris)
--
-- Jalankan SETELAH seed_1a, 1b, dan 1c.
-- NULL pada q1..q4 berarti BELUM ADA DATA, bukan nol.
-- Aman dijalankan berulang; baris yang sudah ada tidak ditimpa.
--
-- Koreksi satuan (Agustus 2026): dua nilai Percent OPI 2025 yang sebelumnya
-- ditulis sebagai bilangan bulat persen sudah diubah menjadi desimal -
-- OPI-011 Q2 dari 9 menjadi 0,09 dan OPI-033 Q4 dari 91,7 menjadi 0,917 -
-- sesuai konfirmasi pemilik indikator.
-- =====================================================================

-- Pastikan kolom region dan primary key sudah sesuai, apa pun urutan menjalankannya.
alter table public.indicator_years
  add column if not exists region text not null default 'National';

do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'indicator_years_pkey'
      and (select count(*) from unnest(conkey)) = 2
  ) then
    alter table public.indicator_years drop constraint indicator_years_pkey;
    alter table public.indicator_years
      add constraint indicator_years_pkey primary key (indicator_id, year, region);
  end if;
end $$;

insert into public.indicator_years
  (indicator_id, year, region, target, q1, q2, q3, q4, notes, key_initiatives, source, status) values
('OPI-001',2024,'National',0.6,null,0.56,null,0.69,'- Average % of children in (22) TF-operated RAS centers are developmentally on-track = 69% ((48% + 90%))/2

- CREDI score RAS 2.0 = 48% children meeting development target. Quantitative data of RAS 2.0 Evaluation using CREDI tool showed improvement in Language aspect of child development. Follow-up qualitative data collection is on-going to investigate why the CREDI result is lower than expected target.

- ASQ monitoring showed that 90% children are developmentally on-track in Q4 2024 as compare…',null,null,'approved'),
('OPI-001',2025,'National',0.6,null,0.94,null,0.89,'ASQ score October 2025',null,null,'approved'),
('OPI-002',2024,'National',1.0,null,0.0,null,1.0,'Pilot for national survey for ECDI (child outcome measurement age 4-6) by BKKBN is on-going till Dec 2024'||chr(59)||' 1,500 sample village identified.',null,null,'approved'),
('OPI-003',2024,'National',1.0,null,0.0,null,1.0,'- The enactment of UU KIA with a thought contribution from TF
- Support for RPJMN inclusion of parenting/early stimulation clause is on-going. 
- Assisted KPPPA and BSN in developing national standard SNI 9245:2024 on Child Friendly Daycare.',null,null,'approved'),
('OPI-004',2024,'National',0.0,null,0.0,null,0.0,'Advocacy to raise government stakeholders on the importance of PES will only start in 2025',null,null,'approved'),
('OPI-004',2025,'National',15.0,null,20.0,null,20.0,'RPJMD Workshop
Sum A (4): Batubara, Kota Pematangsiantar, Medan, and Karo
Sum B (7): Dumai, Pekanbaru, Siak, Bengkalis, Batang Hari, Tebo and Muaro Jambi
Jawa (3): Kendal, Tegal and Kota Semarang
Kalimantan (5): Balikpapan, Paser, Bontang, Kutai Kartanegara, Kutai Barat
Jakarta (1): Pandeglang',null,null,'approved'),
('OPI-005',2024,'National',4.0,null,2.0,null,27.0,'- International Organisation (UNICEF, WB, WHO)
- Universities (UI, UGM, UPI, UNPAD, Atmajaya, Nusa Cendana)
- Research Organization(SMERU, J-PAL, PUSKAPA)
- SEAMEO
- HIMPAUDI',null,null,'approved'),
('OPI-006',2024,'National',80000.0,null,0.0,null,14000.0,'Total catalytic funding:
- Renovation & Operatioal EC Center (RAS) Kukar - Desa Loa Pari : IDR 144,460,500 (USD 9.3K)
- Renovation & Operatioal EC Center (RAS) Kukar - Desa Bendang Raya : IDR 70,732,500 (USD 4.6K)
- Operational EC Center (RAS) Jakarta : IDR 6,000,000 (USD 0.4K)

- Donation from desa for RAS operation cost -->
RAS sustainability that is not yet part of priority strategy but realized early.
- Higher target 2024 with assumption of RAS could have been scaled in 2024. However, scalin…',null,null,'approved'),
('OPI-007',2024,'National',0.01,null,0.0,null,0.79,'From SMERU Evaluation, 15 out of 19 partner districts score 80 and above on government capacity for stunting reduction',null,null,'approved'),
('OPI-007',2025,'National',0.7,null,0.79,null,0.79,'From SMERU Evaluation, 15 out of 19 partner districts score 80 and above on government capacity for stunting reduction',null,null,'approved'),
('OPI-008',2024,'National',10.0,null,null,null,10.0,'- Integration of stunting data into SATU SEHAT
- 1000 Days Fund study recommendation accepted by Minister BGS
- 8 policies from WB MDTF 2023 but reported in 2024, including: TA to MOH Promkes on SBCC in two districts, eHDW implementation,Nutrition Guide in Puskesmas, TA for Pustu, Evaluation of Convergence Actions, Fiscal Note for Stunting, TA for covid-19 social assistance, TA for Rice Fortification',null,null,'approved'),
('OPI-008',2025,'National',10.0,null,0.0,null,12.0,'The implementing partners (World Bank for MDTF and UNICEF) are expected to submit reports by the end of the year.

Achievement comes from WB last year report',null,null,'approved'),
('OPI-009',2024,'National',0.0,null,0.0,null,0.0,'Numeracy and Parent Engagement levers identified. Pilot to commence in 2025.',null,null,'approved'),
('OPI-009',2025,'National',3.0,null,0.0,null,3.0,'Proxy Indicator for 2025 : # of lever programs launched'||chr(59)||' 1. Teacher New Lever
- ToT Teacher (Ocotober)
- Teacher Training (November)

2. Parent New lever
- 2nd Logistical Testing in Kendal (November)

3. School Leadership
- Online Kick off w/ Nias and Pandeglang district (December)
- Logistical Testing in Nias (December)',null,null,'approved'),
('OPI-010',2024,'National',17.0,null,15.0,null,17.0,'- 15 districts (Kukar and Balikpapan didn’t join Fasda Perubahan because they are focusing on supporting OIKN)
- 2 districts continue to replicate PINTAR training program : Cimahi & Tana Tidung',null,null,'approved'),
('OPI-010',2025,'National',21.0,null,13.0,null,21.0,'Fasilitator Grant Project (13): 
Sum A (2): Batubara, Kota Pematangsiantar
Sum B (6): Pekanbaru, Bengkalis, Dumai, Batang Hari, Tebo, Muaro Jambi
Jawa (2): Semarang, Tegal
Kalimantan Timur (3): Balikpapan, Bontang, Kukar

Replikasi (2):
OIKN & Pekalongan

School Leadership Project (2): 
Nias and Pandeglang – currently in progress of the baseline study. to be implemented in Q1 2026'||chr(59)||' 

Teacher & Parents New Lever (4):
Kendal, Paser, Karo, Siak – roll out November',null,null,'approved'),
('OPI-011',2024,'National',0.4,null,0.12,null,0.47,'- 6 Perbup (P. Siantar, Muaro Jambi, Dumai, Batanghari, Kendal, Tebo)
- 2 Perkadin (Kota Semarang and Kota Cimahi) related to strengthen and develop literacy and numeracy skills
(8 districts / 17 districts = 47%)',null,null,'approved'),
('OPI-011',2025,'National',0.11,null,0.09,null,null,'Successfully influenced RPJMN to incorporate foundational literacy and numeracy. Now, supporting RPJMD to include foundational litnum. 
Sum A (2) : Pematangsiantar (Perwali, RPJMD), Karo (RPJMD)
Sum B (5) : Batanghari (Perbup, RPJMD), Kota Dumai (Perwali, RPJMD), Muaro Jambi (Perbup, RPJMD), Tebo (SK Bupati, RPJMD), Kota Pekanbaru (RPJMD)
Jawa (4): Kendal (Perbup, RPJMD), Kota Semarang (Perkadin, RPJMD), Tegal, (RPJMD), Cimahi (Perkadin), 
Kalimantan (2) : Paser (RPJMD), Kota Bontang (RPJMD)
Nas…',null,null,'approved'),
('OPI-012',2024,'National',80000.0,null,null,null,40000.0,'Govt fund for replication PINTAR (data collected based on direct discussion with government).
- Tana Tidung : IDR 311,200,000 (USD 20K)
- Cimahi : IDR 316,995,000 (USD 20K)

Target not achieved because dissemination was not active in Jakarta and Kutai Barat for 2024 (Kutai Barat will start in 2025)',null,null,'approved'),
('OPI-013',2024,'National',0.2,null,0.0,null,0.2,'Gerakan Numerasi Nasional was initiated by MoECRT in 2024. Our LE staff contributed in the discussions with MOECRT on 23 Dec 2024.',null,null,'approved'),
('OPI-013',2025,'National',0.4,null,0.4,null,0.6,'Tanoto Foundation contributed to the GNN launch on 19 Aug 2025 by hosting a booth. The exhibit featured two Fasda (facilitators) who shared PINTAR lessons learned in numeracy and demonstrated support for coding by integrating mathematical thinking about pattern',null,null,'approved'),
('OPI-014',2024,'National',0.2,null,0.2,null,0.3,'-APS Modeled in 8 districts and are sustainable in 50% of the district (Siak, Dumai, Kendal and Karo).
-Best practice and lesson learned published.',null,null,'approved'),
('OPI-014',2025,'National',0.4,null,0.2,null,0.4,'Update progres district sustainable school monitoring system:
1. Siak : 80%
2. Dumai: 100%
3. Kendal: 100%
4. Kutai Barat: 80%
5. Karo: 100%',null,null,'approved'),
('OPI-014',2026,'National',1.0,0.36,0.39,null,null,'Milestones, 
School monitoring system is defined as tech-enabled data collection of school/classroom performance in teaching & learning whereby data is used for decision making at the respective administrative government level. Adoption means tools/best practices/policies are in-place to support school or classroom performance monitoring.
1. program modeled in 5districts
2. best practice documented and disseminated'||chr(59)||' sustainable monitoring system established in model districts
3. recommendations…','- Evaluation update by MLE
- Successfull transfer of APS in Kendal, Karo, and Dumai
- Presentation of APS to MoPSE (Policy Brief)
- Continue in 2 districts ( Kubar, Siak)','Program report','approved'),
('OPI-015',2024,'National',0.2,null,0.0,null,0.2,'- Study on PPG Prajabatan Curriculum & Program Delivery completed and disseminated to MOECRT and TTIs. 
- Konsorsium Pendidikan Daerah established in 5 provinces: Jambi, Sumut, Riau, Jateng, Kaltim',null,null,'approved'),
('OPI-015',2025,'National',0.4,null,null,null,0.4,'Key data sources are mapped, and a harmonized dashboard specification is agreed upon. Inter-OPD coordination (Education Office, BKPSDM, BKAD) has started during kick-off session on 1 October 2025.',null,null,'approved'),
('OPI-016',2024,'National',0.7,0.0,0.0,0.0,0.777778,'- 9 Fellows on-board 
- Outcomes data will be available in 2025',null,null,'approved'),
('OPI-016',2025,'National',0.7,0.0,0.0,0.0,0.888889,'Social Development Sector :
1. Claresta Vega Audrey : Join TFID as a Management Trainee
2. Denny Susanto : Join TFID as a Management Trainee
3. Feliani : Signed with The Wikimedia Foundation
4. Ni Kadek Putri Adyaningsih : Join Merah Putih Hijau a NGO which interest in circular econony
5. Shania Ruth Diaz : Join CD/CSR team in RAPP
6. Charla Eunike Luan : Strengthening local NGO in Kupang
7. Cornelius Prabhaswara Marpaung : Join CRMS as a knowledge management officer
8. Andika Simamora : Consult…',null,null,'approved'),
('OPI-016',2026,'National',0.7,0.0,0.0,null,null,'Numerator: # of fellows who obtain full-time, part-time, or start their own initiaives in social development sector within ≤ 4 months after program graduation
Denominator: total of fellows per cohort','- Improve field experience and project learning 
- Link fellows to more philanthropies and NGOs','Tracer survey','approved'),
('OPI-017',2024,'National',0.65,null,0.51,null,0.51,'Half of Scholars of Cohort 2021 met the expected competency score (2.5 out of 4) at endline, versus 65% scholars of Cohort 2020. Cause: Pandemic-affected cohort experienced mostly online programs. Domain with low score: Grit, Strive for Excellence, Agility, Relationship, Innovative, Planning, Global Citizenship',null,null,'approved'),
('OPI-017',2025,'National',0.65,null,0.69,null,0.69,'Cohort 2022 endline result',null,null,'approved'),
('OPI-018',2024,'National',0.9,null,0.81,null,0.81,'- 37% scholars of Cohort 2020 secured employment before graduation.
- 85% scholars are economically active after graduation'||chr(59)||' 77% scholars (include only employed and unemployed) are employed <6 months
- Tracer study for Cohort 2021 to be conducted in Dec 2024',null,null,'approved'),
('OPI-018',2025,'National',0.9,null,0.0,null,0.98,'Cohort 2021 graduation',null,null,'approved'),
('OPI-019',2024,'National',0.15,null,0.1,null,0.4,'- Majority of alumni cared for issues around SDG 1, SDG 2,
SDG 3, SDG 4
- 105 out of 262 alumni respondence conduct pay-it-forward activities and consist of : 50% respondents donate, 22% volunteer occasionally,
25% develop community, 3% work in social sector.
- Next tracer study in Dec 2024',null,null,'approved'),
('OPI-019',2025,'National',0.3,null,0.38,null,0.38,'NCS graduating in 2021 exhibited strong pay-it-forward spirit, contributing back for SDG 3 (Health) and SDG 4 (Education). 20% of those who volunteers hold the management role in the org.',null,null,'approved'),
('OPI-020',2024,'National',1.0,null,1.0,null,3.0,'- Cohort 2024 includes KIP-K scholars (MOECRT’s higher education scholarship program for underprivileged family).
''- ITB, TELADAN partner university, included Lead Self Module into the student orientation program reaching all new students. 
- IPB converted Lead Self to SKS',null,null,'approved'),
('OPI-020',2025,'National',4.0,null,3.0,null,5.0,'Cumulative Achievements (5):
- Cohort 2024 includes KIP-K scholars (MOECRT’s higher education scholarship program for under privileged family).
- ITB, TELADAN partner university, included Lead Self Module into the student orientation program reaching all new students. 
- IPB converted the Lead Self module into academic credits (SKS).
- UNRI Student Journey SoftSkills Development (December 2025)
- UI Lead Self Training (Adaptation Skills Module) for new Students (KIP-K scholarship recipient (Nove…',null,null,'approved'),
('OPI-020',2026,'National',2.0,1.0,0.0,null,null,'Total universities that replicate leadership and soft skill development practices using TELADAN as a key reference','- Provide technical assistance to partner universities and stakeholders to design and implement soft-skill development using TELADAN as a key reference','Activity Report','approved'),
('OPI-021',2024,'National',3043064.0,null,3192081.0,null,3192324.0,'- Unicef : 3.053.000 pregnant women & caregivers
- PASTI: 139.029 beneficiary for maternal, newborn and child survival program
- Rumah Anak SIGAP : 2.211 (2023) + 784 (2024)',null,null,'approved'),
('OPI-022',2024,'National',60000.0,null,55988.0,null,59971.0,'Teachers reached : 54.835 (annual report 2023) + 5.136 (FY 2024) teachers and principals are trained:
- Teacher reached in fasda perubahan project: 3.157
- PINTAR dissemination at Cimahi area : 1.739 (1.628 teachers + 111 principals)
- PINTAR dissemination at Tana Tidung area : 240 (239 teachers +1 principals)
- Kukar, Balikpapan didn’t join Fasda Perubahan
- DKI Jakarta and Kubar did not conduct dissemination.',null,null,'approved'),
('OPI-023',2024,'National',2000.0,null,2457.0,null,2995.0,'Total active child attendant in RAS = 1,045 (at capacity).',null,null,'approved'),
('OPI-024',2024,'National',20000.0,null,3372.0,null,23958.5,'- 21.792 trained from CSD and SDG AI programs
- Mobile Leaning Program = 50% x 4.333 (7.481 course enrollment with 4.333 course completed & 50% for government sector)',null,null,'approved'),
('OPI-025',2024,'National',8598.0,null,8599.0,null,8599.0,'- Annual Report 2023 : 8,338
- Cohort 2024 = 261 (161 Teladan + 100 KIP-K)',null,null,'approved'),
('OPI-026',2024,'National',10000000.0,null,89422502.0,null,105712542.0,'- Conventional media: 97.552.825 (from 1.088 media coverage)
- Digital & social media: 8.159.717
- Higher public reached has aligned with the new strategy re-focusing from local to national media',null,null,'approved'),
('OPI-027',2024,'National',0.1,null,0.0,0.61,0.396,'We only started engaging alumni in H2 2024 with our alumni newsletter:
•1st edition (Aug 2024) – broadcast via email and WA group: 
Target recipient (total alumni email addresses): 4268
Open rate (# of engaged alumni): 2008 (61.3%)
•2nd edition (Nov 2024) – broadcast via email and WA group: 
Target recipient (total alumni email addresses): 3640 (after we sorted and double check the recipients’ email)
Open rate: 1388 (39.6%)',null,null,'approved'),
('OPI-028',2024,'National',80.73,null,null,null,80.73,'- Signed MOU with MOHA for Leadership Development for newly elected sub-national leaders
- 6 TA on-going to support LAN on digital transformation, upskilling on public policy analysis, and LAN institutional strengthening',null,null,'approved'),
('OPI-029',2024,'National',null,null,null,null,null,'- Net promoter score (Promoter – Detractor) = 72%
- 75% stakeholders mentioned TF as top of mind'||chr(59)||' 57% wider audience mentioned TF as top of mind. 
- 96% respondents love and quite love the brand TF
- 90% respondents are very satisfied and satisfied with performance',null,null,'draft'),
('OPI-029',2026,'National',null,null,null,null,null,'Level:
- Score perception survey','- Develop stakeholder perception measurement framework
- Align framework with Global Comms 
- Conduct baseline','Stakeholders perception survey report','draft'),
('OPI-030',2024,'National',22.0,null,6.0,null,24.0,'- 3 journals on ECED published (2 International, 1 national)
- 15 Op-eds
- 2 RAS Evaluation, 2 SPP, 2 Education roadmap',null,null,'approved'),
('OPI-031',2024,'National',6.0,null,1.0,null,8.0,'1. ARNEC (Pak Eddy) - 27 May 2024, Minister of Women, Family and Community Development of Malaysia
2. HLF MSP 2024 (Pak Benny) - 1-3 September 2024, Presiden, Menteri, Kepala UN -
3. The Launch of Manajemen Talenta Nasional - Yosea -- 9 Oktober 2024
4. Sharing Digitalisasi & Penanganan Stunting di Jepang & Indonesia LAN RI (Cilla) 29 Oktober 2024 - (Minister Embassy of Japan in Indonesia, Hoshin Daisuke)
5. LAN National Future Learning Forum - 18 November 2024 - Pak Eddy - kepala LAN dan Menteri…',null,null,'approved'),
('OPI-031',2026,'National',20.0,9.0,5.0,null,null,'Example of highly influential events: 
1) Ministerial-level and above, national & regional policy forum, UN events 
2) including external or internal 
3) the objective of the event is to inform policy change in regards to Advocacy Goal 1, Advocacy Goal 2, Soft-skill development, MCHN, Philanthropy 
4) high-impact','- Improve attendance of highly influential person
- Increase the use of TF data in presentation','Activity Report','approved'),
('OPI-032',2024,'National',0.0,0.0,0.0,0.0,0.0,'Verified by Audit',null,null,'approved'),
('OPI-032',2025,'National',0.0,null,0.0,null,null,'No audit adjustment',null,null,'approved'),
('OPI-032',2026,'National',0.0,0.0,0.0,null,null,null,'- Exercise SOP 
- Conduct Audit','Audit report','approved'),
('OPI-033',2024,'National',0.9,null,0.0,null,0.0,null,null,null,'approved'),
('OPI-033',2025,'National',0.9,null,0.34,null,0.917,'- Total spending TF Indo IDR 170.6b from total budget IDR 186.6b exclude CAPEX.
- Overhead cost : IDR 16.6b from total spending TF Indo
IDR 173.4b (excluded CAPEX of 0.8b).',null,null,'approved'),
('OPI-033',2026,'National',0.9,0.77,0.83,null,null,'Based on monthly report issued by FATLC','- Exercise Budget Control','Finance report','approved'),
('OPI-034',2024,'National',null,null,0.0,null,0.0,null,null,null,'approved'),
('OPI-034',2025,'National',null,null,0.04,null,0.096,null,null,null,'approved'),
('OPI-034',2026,'National',null,0.07,0.09,null,null,null,null,null,'approved'),
('OPI-035',2024,'National',7000000.0,null,0.0,null,6500000.0,null,null,null,'approved'),
('OPI-035',2025,'National',7000000.0,0.0,0.0,0.0,6500000.0,null,null,null,'approved'),
('OPI-035',2026,'National',7100000.0,0.0,0.0,null,null,null,'- Implement new delivery model of TELADAN 
- Introduce new assessment tool for leadership competency
- Exercise more cost-efficient activities for learning enrichment','Finance report','approved'),
('OPI-036',2024,'National',3700000.0,null,0.0,null,3640000.0,null,null,null,'approved'),
('OPI-036',2025,'National',3700000.0,null,null,null,null,null,null,null,'draft'),
('OPI-036',2026,'National',2000000.0,0.0,0.0,null,null,null,null,null,'approved'),
('OPI-037',2024,'National',5.0,null,0.0,null,6.0,'11 National + 4 regional initiatives:
1. Improvement of business trip update visibility - Jateng
2. Installment of calendar for event - Jateng
3. Standarization of project document - Riau
4. Standarization of MoM format - Riau
5. Installment of MLE Dashboard - Jakarta
6. Program user utilize RACI for project manajement planning as resulted PM workshop
7. TF digital app : completed SIGAP and TELADAN systems integration.

8 new & revised SOP :
- Resource person honorarium
- Recruitment
- Business…',null,null,'approved'),
('OPI-038',2024,'National',null,0.0,0.0,0.0,0.0,null,null,null,'approved'),
('OPI-038',2025,'National',null,0.0,0.0,0.0,0.008,'Regrettable attrition by December 2025',null,null,'approved'),
('OPI-038',2026,'National',null,0.0,0.0,null,null,null,null,'HR report','approved'),
('OPI-039',2024,'National',0.87,0.0,0.0,0.0,0.0,'13 out of 14 fullfilled',null,null,'approved'),
('OPI-039',2025,'National',0.9,0.67,0.67,0.75,0.6,'3 of 5 critical vacancy already filled
vacancy: BE Program Lead (will be onboard Jan 2026) & Head of SPP',null,null,'approved'),
('OPI-039',2026,'National',1.0,0.857,0.857,null,null,null,null,'HR report','approved'),
('OPI-040',2024,'National',1.0,0.0,0.0,0.0,0.0,'All key position already have successor',null,null,'approved'),
('OPI-040',2025,'National',1.0,0.0,1.0,0.0,0.9375,'Head of SPP vacant',null,null,'approved'),
('OPI-040',2026,'National',1.0,0.857,0.857,null,null,'Regional level (successor, BE + ECED specialist)','- Conduct training on data literacy, MTP, and FLP 
- Conduct on-the-job assignment/shadowing for identified potential subject-matter','HR report','approved'),
('OPI-041',2025,'National',0.1,null,0.0,null,null,'Proxy indicator for 2025 : Milestones achieved',null,null,'approved'),
('OPI-042',2025,'National',0.2,null,0.4,null,null,'Proxy indicator for 2025 : Milestones achieved'||chr(59)||' The finalisation of the RAN PAUD HI is still pending the submission of detailed output annexes from each line ministry serving as task force members. The launch is planned for February 2026.',null,null,'approved'),
('OPI-043',2025,'National',0.3,null,0.2,null,0.2,'By December, the ECED Council is focused on finalising the strategy, with implementation planned for next year',null,null,'approved'),
('OPI-043',2026,'National',0.6,0.2,0.4,null,null,'Milestones:
- 20%: institution, member, and strategy in-place 
- 40%: policy advocacy through the council 
- 60%: projects launched and implemented
- 80%: ECED council is sustainable as community
- 100%: ECED council is self-managed"','- Project implementation 
- Strengthening measurement','Observation checklist','approved'),
('OPI-044',2025,'National',2.0,null,1.0,null,3.0,'1. Village Funds (Ponoragan, Loa Pari, Gandaria, Tuwel)
2. Budget Allocation under the Budget Implementation Document (DPA) of the Semarang City Health Office (Bandarharjo)
3. Community contributions (parents)- Sokawera',null,null,'approved'),
('OPI-044',2026,'National',4.0,0.0,0.0,null,null,'Criteria to meet:
- Institutions include private sector, philanthropy, NGOs, government 
- Commitment includes funding, program, human resources, in-kind, technical assistance. 
- Commitment must be traceable to TF catalytic efforts 
- Commitment to build new Rumah Anak SIGAP

2026: 1 by SPP (ECED Collab/RAS), 2 by regional (RAS), 1 by P&A (ECED Collab)','ECED Collaboratives and Partnership
- Map key funders and projects for ECED Collaboratives
- Engage key funders 
- Organise convening events for ECED

Rumah Anak SIGAP:
- Develop program in a box for Rumah Anak SIGAP 
- Advocate to government and philanthropy to replicate Rumah Anak SIGAP
- Build ca…','MoU w/ philantrophic organizations','approved'),
('OPI-045',2025,'National',5.0,null,0.0,null,8.0,'District Level
1. Replication in Jawa (Pekalongan)
2. Dissemination in Sum B (Bengkalis & Tebo)
3. KTT & Kutai Barat (APS)
Institutional Level
1. Gates Foundation (kickoff December 2025)
2. UNICEF (FAASTER Project)
3. WVI (School leadership)

Activities in Jepara are limited to the design phase only',null,null,'approved'),
('OPI-046',2025,'National',1.0,null,0.5,null,0.5,'Progress on SDG Academy Indonesia’s National Ownership (Q4):
• Supported the handover to Bappenas through draft 2026 roadmap and comms plan, knowledge-transfer workshops, and IT technical support.
• Supported the soft launch at SAC 2025 and preparation for a “Grand Launch” in early 2026.
• Initiated a 2026 programme to synchronise RAD across four pilot provinces, aligning 2025–2030 policies and integrating FLN and PES.',null,null,'approved'),
('OPI-047',2025,'National',null,null,null,null,null,'Perception survey is based on 2023 study. The next perception survey will be done in H1 2026',null,null,'draft'),
('OPI-048',2025,'National',25.0,null,20.0,null,55.0,'OpED (51):
- Regional (37)
- Nasional (3)
- ECED Councl (10)

Publication (4):
LE (3):
- Pembelajaran Program Orang Tua Sahabat Anak Belajar (OTSAB)
- Improving Learning Outcomes in Indonesia through the PINTAR Program
- The Effectiveness of Different Modalities of Digital-based Teacher Training Program in Indonesia
TELADAN (1) : TELADAN Program Evaluation Report',null,null,'approved'),
('OPI-048',2026,'National',21.0,2.0,13.0,null,null,'`- Collaborative Op-ed by strategic partners (12): 2 per region, 4 national
- Citation by academic paper/journal, materials produced by media, UN organization, NGOs, governments, etc (5)
- ''4 impact stories/lesson learned written and disseminated (Case study: Fasda Perubahan, HTHT Study, Rumah Anak SIGAP, INSPIRASI)','- Increase target in citation and reference, not only # publications
- Facilitate dissemination event by SPP
- Support the development of government presentation to have reference to TF studies
- Established Impact Hub','Op-ed, articles/ documents/ media with citation','approved'),
('OPI-049',2025,'National',9.0,null,8.0,null,18.0,'1. Indonesia Scholarship Network 2025
2. UNICEF Global High-Level Roundtable
3. CAPS Hong Kong
4. CIES Chicago
5. Talkshow Pengembangan Policy Brief Berbasis Data 
6. Lokakarya “Penguatan Kebijakan Pendidikan Daerah melalui Sinkronisasi RPJMN 2025–2029 dan SDGs ke Perencanaan Daerah
7. Lokakarya “Inovasi untuk Percepatan Pencegahan dan Penurunan Stunting” 
8. Early Childhood Roundtable, Abu Dhabi Early Childhood Authority 
9. Asia-Pacific Regional Conference on Early Childhood Development (ECD)…',null,null,'approved'),
('OPI-050',2025,'National',100000000.0,null,40043776.504,null,122647060.0,'Organic reach from conventional media and digital channels',null,null,'approved'),
('OPI-051',2025,'National',250.0,null,285.0,null,573.0,'Alumni engagement was carried out through the following activities:
- Tracer study: 135 participants
- Offline/online events and alumni newsletters: 438 participants',null,null,'approved'),
('OPI-052',2025,'National',0.05,null,0.0,null,0.07,null,null,null,'approved'),
('OPI-052',2026,'National',0.03,0.01,0.04,null,null,null,null,null,'approved'),
('OPI-053',2025,'National',12000000.0,null,null,null,null,'- Average tuition fee / scholar / semester = IDR 6.4 mio
- Recruitment cost / scholar = IDR 3.33 mio (159 reguler + 20 KIP-K)
- Leadership Dev. Cost /scholar /cohort = IDR 15.2 mio',null,null,'draft'),
('OPI-053',2026,'National',14500000.0,0.0,0.0,null,null,null,null,null,'approved'),
('OPI-054',2025,'National',14.0,null,0.0,null,15.0,'1) Dashboard (4) : Regional Performance, RAS monitoring, TELADAN, Action tracker
5) Regional initiatives (4) : Sum A, Sum B, Jawa, Kalimantan
9) LDS human library
10) KM online platform update
11) Kaizen RAS
12) Request for communications support
13) Partnership bank
14) Inventory request and management
15) Payment logbook 2026 feature update',null,null,'approved'),
('OPI-055',2026,'National',4.0,1.0,4.0,null,null,'Criteria for policy:
- Policy is resulted from TF''s technical assistance to national government
- Policy is in the areas: (1) cadre capacity building, (2) data system strengthening, and (3) planning & budgeting 
- This includes framework, regulation, instruction, decree

Policy recommendations format:
-Policy brief and/or recommendation based on study which presented to the Government','- TA on MBG to BGN contributes to 2 policy recommendations/development
- MDTF evaluation presented to the government
- SATUSEHAT recommendation on ASIK (based on report on the study)','Activity/IP Report','approved'),
('OPI-056',2026,'National',1.0,0.0,0.0,null,null,'Milestones:
-50%: Programme has a robust MLE and the learning agenda is developed. 
-50%: Programme is ready to be kicked off (government stakeholders and implementing partners onboard, tools are ready to use, targeted beneficiaries are identified)','- Co-develop concept notes with UNICEF
- Publish RFP','Document of MLE Plan and Program Design','approved'),
('OPI-057',2026,'National',1.0,0.25,0.5,null,null,'Milestones, average progress in 18 villages:
1. system established (2026)
2. data collected/updated (2026)
3. data utilized and used for decision making (2027)
4. data system sustained through budget/policy (2028-2030)','1. Implemention of Stunting 2.0
2. Ensure evidence generation for the effectiveness of data-driven decision making and village-level intervention','Activity/IP Report','approved'),
('OPI-058',2026,'National',18.0,0.0,0.0,null,null,'Criteria: successful exit i.e. budget to ensure continue functioning of desa model (18 out of 24 - 75%)','Complete PASTI Grant, Evaluate and Capture Lessons Learned
Ensure sustainabiity of the program in intervened villages','Activity/IP Report','approved'),
('OPI-059',2026,'National',20.0,0.0,7.0,null,null,'Criteria of CoE: 
to achieve 3 out 5 deliverables:
- 70% parents has 85% attendance rate (6 out of 7 visits) (2026)
- capacity per center 50 dyad (2027)
- score of quality services >75 (2026)
- standardize facilities (2026)
- have cost effective delivery (2027)

Newly built RAS:
2026: 5 centres to be built in Medan using TF funding. Programme implementation will start in 2027
2027: 10 centers to be built and operationalize using TF funding (5 centers start to operate in Medan, 5 centers to be bu…','- Scale Semi-fixed Attendance in all Rumah Anak SIGAP
- Implement A/B Testing for Cadre vs Professional for 1-1 Stimulation
- Optimise cost 
- Improve enrollment by increasing demand and a more frequent recruitment

''- Engage government for replication
- Build/renovate Rumah Anak SIGAP centers','Rumah Anak SIGAP monitoring dashboard','approved'),
('OPI-060',2026,'National',10.0,11.0,1.0,null,null,'Government policies/regulation published or strengthened.
national level
2025: RPJMN 2025-2029 (accomplished)
2026: Permenko RAN PAUD HI, Road Map Parenting - Bappenas/KPPPA
2027-2030: RUU PA, Perpres PAUD HI

regional level:
- PES issues included in district development planning documents (Renja/RKPD)
- Perbup/Perwali LN signed (at least a draft in 2026)
- Program and budget allocated (KAK, SE/SK, Juklak)','- Support for RUU SISDIKNAS 
- Support for BPS on ECDI 

''- TA to district government to develop derivatives policy and implement PES related programs (e.g. Kota Layak Anak)','National, Presidential, or Ministerial level planning, regulation, and/or SoP/guideline','approved'),
('OPI-061',2026,'National',1.0,0.25,0.6,null,null,'Milestones:
- Pre pilot (2026)
 1. Module is ready for pilot
 2. Sustained government commitment to proceed to pilot stage
- Pilot (2027-2030)
 3. Dissemination of pilot impact results
 4. Strengthened national policy (RPJMN/RPJMD 2030-2034)','- Evaluation of pre-pilot
- Program design for pilot based on pre-pilot result','Observation checklist','approved'),
('OPI-062',2026,'National',6.0,0.0,0.0,null,null,'Criteria, to achieve all of this deliverables:
a). fidelity, attendance rate of participants 
 - DDSL : principals, senior teachers, and schools operators > 80%
 - Numeracy: teachers training > 80%
 - Numeracy: Parents socialization > 40%
 - PPG: teacher mentors training > 80%
 - FAASTER: teacher training > 80%
b) advocacy : meeting progress and/or joint monitoring 2x
c) implementation: all planned activities implemented

*2030 target to be reduced to 4 as it will be measured based on a higher l…','- Implement DDSL, JPAL Numeracy, PPG with high fidelity
- Ensure robust measurement 
- Engage government for updates and commitment for future dissemination and adoption','Program tracking/monitoring report','approved'),
('OPI-063',2026,'National',2.0,0.0,2.0,null,null,'Non partner districts or other institutions that adopt or replicate PINTAR lesson learned (monitoring system, teachers training system). All BE portfolio will be counted here not limited to Pintar 1.0 or/and Pintar 2.0

2026:
- Regional: 2
- SPP: 0','''- Replicate PINTAR to new districts 
- Engage new funders
- Organise convening events','- Budget allocation by government, policy or SK issued by government.
- MoU/Letter of Commitment with other institutions.','approved'),
('OPI-064',2026,'National',3.0,1.0,5.0,null,null,'- Local innovation to improve FLN initiated by PINTAR Facilitators. 
- Adopted: Local innovations that are supported through external funding sources (other than TF) for the implementation or scale-up of the Fasda project.','- Evaluate Fasda Perubahan
- Revamp Fasda Perubahan Program 
- Comms & Regional initiatives: to amplify innovation, gain recognition from district leaders, in order to drive adoption across other schools and educational institutions.','- Facilitator grant report
- Program evaluation report','approved'),
('OPI-065',2026,'National',13.0,24.0,24.0,null,null,'Government policies/regulation enacted and/or in-place.
national level
2025: PPG supervision guide produced, and GNN and Deep Learning launched
2026: RUU Sisdiknas, GNN implementation 
regional level
- LN issues included in district development documents (Renja/RKPD)
- Perbup/Perwali LN signed (at least a draft in 2026)
- Program and budget allocated (KAK, SE/SK, Juklak)','- TA to RUU Sisdiknas
- TA to GNN','National, Presidential, or Ministerial level planning, regulation, and/or SoP/guideline','approved'),
('OPI-066',2026,'National',4.0,1.0,0.0,null,null,'3 transformed delivery of LS, LO, and PP

1 Assessment tools developed with milestones:
- TELADAN leadership competencies defined
- Instrument developed 
- Instrument tested
- Assessment instrument used in TELADAN monitoring and program optimization','- Re-design, adjust, and implement LS, LO, and PP learning journey with new delivery models
- Develop and test assessment tools
- Use the new assessment tools in endline cohort 2023, midline cohor 2025, and baseline cohort 2027','- LD new delivery booklets
- Assessment Tools, Assessment Report','approved'),
('OPI-067',2026,'National',1.0,0.0,0.5,null,null,'Criteria:
- 90% of Scholars graduated employed or self-employed <=6months after graduation
- 65% of Tanoto scholars show evidence of soft skill competencies development','- Improve the curriculum for Lead Others and PEP, in conjunction to the change of new delivery models
- Improve learning enrichment implementation (TSA, TSG, Global Experiences & Sponsorship) as integrative approach of LD','- Tracer survey
- Endline assessment report','approved'),
('OPI-068',2026,'National',1.0,0.43,0.8,null,null,'Criteria:
- 20%: MoU/PKS active/issued
- 20%: Foundation level Meetings w national high level officials (minister/vice/Echelon-1) and regional high level officials (bupati atau wakil/walikota atau wakil/ Sekda atau Kepala OPD)
- 20%: Gov high level officials attended TF events
- 20%: Recognitions from government (Awards, documentation of statements, letters)
- 20%: Zero MoU/PKS termination due to dispute','- Implement government engagement meetings as per government engagement strategy
- Present policy briefs and other key knowledge products','MoU/PKS, MoM, Activity report','approved'),
('OPI-069',2026,'National',2000.0,0.0,0.0,null,null,'Civil servants that participate in GCB Programmes, equipped with capacity to improve policies around FLN and/or PES','- Ensure GCB modules contain reference to best practices in LN or PES
- Ensure the participation of TF key stakeholders in GCB programmes
- Continue engagement with LAN to promote enabling policy environment
- 400 ASN from each regions to be participated in the capacity building activities','Activity Report, attendance list','approved'),
('OPI-070',2026,'National',3.0,0.0,0.0,null,null,'Criteria:
- NGO receives strengthening in measurement, leadership, and fundraising','- NPO development initial assessment
- Ensure FAASTER provides NGO capacity building to the local implemeting partners
- Build curriculum/ buy off-the-shelf modules on measurement, leadership, and fundraising
- SPP to support/facilitated the training','NPO assessment, activity/training report','approved'),
('OPI-071',2026,'National',2.0,0.0,null,null,null,'- Orchestrate public advocacy campaign involving national & regional comms team around TF advocacy goals in place by utilizing necessary public advocacy tools (op-ed, podcast, social media, event, community activation, FGD, and other communications initiatives)
- 2026: 1 PES, 1 LN public advocacy campaign','- Conduct public campaign during relevant dates: Teacher''s Day, Nutrition Day, Education''s Day, etc','Activity Report','approved'),
('OPI-072',2026,'National',100000000.0,46353123.0,23859241.0,null,null,null,'- Media partnership
- Social media post and engagement','Media tracking','approved'),
('OPI-073',2026,'National',250.0,194.0,41.0,null,null,'a) 250 alumni engaged to OpEd, as speaker/resource person, events, FGDs
b) 30 TELADAN alumni: alumni contributed back to LDS program (gatherings, mentoring sessions, online platforms)
c) 10 “high profile” alumni engaged to OpEd, speaker/resource person, FGDs','- Revisit alumni management and development strategy 
- Implement alumni engagement programs: involving in LD & partnering with alumni association
- Identify potential inspirational alumni and engage to be featured in OpEd, as speaker/resource persons, or FGDs.','Activity Report','approved'),
('OPI-074',2026,'National',30.0,16.0,0.0,null,null,null,null,null,'approved'),
('OPI-075',2026,'National',10.0,10.0,15.0,null,null,null,null,null,'approved'),
('OPI-076',2026,'National',null,0.0,0.0,null,null,'2025 0.57USD/child/day or Rp9200/child/day
2026: Rp9000 per child per day
2030: 20% decreased','- Optimise enrollment (dyad per center)
- Introduce cadre as the facilitator of individual stimulation 
- Optimise number of center per district
- 2027: return the management of RAS in Kalimantan to Regional Office','Finance report','approved'),
('OPI-077',2026,'National',12.0,0.0,1.0,null,null,'2 per regional
4 for national','- Develop stakeholders management platform (P&A-SPP)
- Conduct A/B testing
- Conduct CI projects','Activity Report','approved'),
('OPI-078',2026,'National',1.0,0.35,0.35,null,null,'- 35%: All BSCs aligned with key priorities 
- 35%: Quarterly review of strategic results against key priorities and actions follow-through
- 30%: Exco/BoT meetings with feedback addressed','- BSC alignment workshops
- Quarterly Review
- LT meetings to address Exco/BoT feedback','1. BSC 
2. ⁠Quarterly review report
3. Exco/BoT/LT meeting MoM','approved'),
('OPI-079',2026,'National',1.0,0.58,0.8,null,null,'- 50%: Investment memo and due diligence are enacted for grants >50K and reviewed
- 50%: Partnership and MoM database established, updated and analyzed for actions','- OneTF Operating System development','1. Approved investment memo
2. ⁠Partnership database bank','approved'),
('OPI-080',2026,'National',1.0,0.3,0.3,null,null,'Includes catalyser collective action capability, data literacy, subject-matter and other core skills','- Conduct baseline and develop assessment tools','HR report','approved'),
('PPI-001',2024,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-001',2025,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-001',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-001',2027,'National',0.55,null,null,null,null,null,null,null,'draft'),
('PPI-001',2028,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-001',2029,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-001',2030,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-002',2027,'National',14.0,null,null,null,null,null,null,null,'draft'),
('PPI-003',2027,'National',630000.0,null,null,null,null,null,null,null,'draft'),
('PPI-004',2027,'National',0.85,null,null,null,null,null,null,null,'draft'),
('PPI-005',2027,'National',7000.0,null,null,null,null,null,null,null,'draft'),
('PPI-006',2027,'National',12.0,null,null,null,null,null,null,null,'draft'),
('PPI-007',2027,'National',13.0,null,null,null,null,null,null,null,'draft'),
('PPI-008',2027,'National',74962.0,null,null,null,null,null,null,null,'draft'),
('PPI-009',2027,'National',16144.0,null,null,null,null,null,null,null,'draft'),
('PPI-010',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-011',2026,'National',0.65,null,null,null,null,null,null,null,'draft'),
('PPI-012',2026,'National',0.45,null,null,null,null,null,null,null,'draft'),
('PPI-013',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-014',2026,'National',100.0,null,null,null,null,null,null,null,'draft'),
('PPI-015',2026,'National',2000.0,null,null,null,null,null,null,null,'draft'),
('PPI-016',2026,'National',50000.0,null,null,null,null,null,null,null,'draft'),
('PPI-017',2026,'National',5.0,null,null,null,null,null,null,null,'draft'),
('PPI-018',2026,'National',500.0,null,null,null,null,null,null,null,'draft'),
('PPI-019',2026,'National',0.0,null,null,null,null,null,null,null,'draft'),
('PPI-020',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-021',2026,'National',0.9,null,null,null,null,null,null,null,'draft'),
('PPI-022',2026,'National',0.74,null,null,null,null,null,null,null,'draft'),
('PPI-023',2026,'National',1049.0,null,null,null,null,null,null,null,'draft'),
('PPI-024',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-025',2026,'National',0.21,null,null,null,null,null,null,null,'draft'),
('PPI-026',2026,'National',0.41,null,null,null,null,null,null,null,'draft'),
('PPI-027',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-028',2026,'National',10.0,null,null,null,null,null,null,null,'draft'),
('PPI-029',2026,'National',1046.0,null,null,null,null,null,null,null,'draft'),
('PPI-030',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-031',2025,'National',0.198,null,null,null,null,null,null,null,'draft'),
('PPI-031',2026,'National',0.14,null,null,null,null,null,null,null,'draft'),
('PPI-032',2025,'National',0.31,null,null,null,null,null,null,null,'draft'),
('PPI-032',2026,'National',0.2,null,null,null,null,null,null,null,'draft'),
('PPI-033',2025,'National',0.83,null,null,null,null,null,null,null,'draft'),
('PPI-034',2025,'National',0.83,null,null,null,null,null,null,null,'draft'),
('PPI-035',2025,'National',0.74,null,null,null,null,null,null,null,'draft'),
('PPI-036',2025,'National',0.84,null,null,null,null,null,null,null,'draft'),
('PPI-037',2025,'National',0.95,null,null,null,null,null,null,null,'draft'),
('PPI-038',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-039',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-040',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-041',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-042',2026,'National',216.0,null,null,null,null,null,null,null,'draft'),
('PPI-043',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-044',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-045',2026,'National',0.5,null,null,null,null,null,null,null,'draft'),
('PPI-046',2026,'National',0.0,null,null,null,null,null,null,null,'draft'),
('PPI-047',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-048',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-049',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-050',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-051',2026,'National',9.0,null,null,null,null,null,null,null,'draft'),
('PPI-052',2026,'National',90.0,null,null,null,null,null,null,null,'draft'),
('PPI-053',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-054',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-055',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-056',2026,'National',36.0,null,null,null,null,null,null,null,'draft'),
('PPI-057',2026,'National',18.0,null,null,null,null,null,null,null,'draft'),
('PPI-058',2026,'National',0.0,null,null,null,null,null,null,null,'draft'),
('PPI-059',2024,'National',0.69,null,null,null,null,null,null,null,'draft'),
('PPI-059',2025,'National',0.92,null,null,null,null,null,null,null,'draft'),
('PPI-059',2026,'National',0.6,null,null,null,null,null,null,null,'draft'),
('PPI-060',2025,'National',0.83,null,null,null,null,null,null,null,'draft'),
('PPI-060',2026,'National',0.6,null,null,null,null,null,null,null,'draft'),
('PPI-061',2026,'National',130.0,null,null,null,null,null,null,null,'draft'),
('PPI-062',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-063',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-064',2025,'National',3329.0,null,null,null,null,null,null,null,'draft'),
('PPI-064',2026,'National',3200.0,null,null,null,null,null,null,null,'draft'),
('PPI-065',2025,'National',1256.0,null,null,null,null,null,null,null,'draft'),
('PPI-065',2026,'National',600.0,null,null,null,null,null,null,null,'draft'),
('PPI-066',2025,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-066',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-067',2025,'National',0.87,null,null,null,null,null,null,null,'draft'),
('PPI-067',2026,'National',0.5,null,null,null,null,null,null,null,'draft'),
('PPI-068',2025,'National',0.93,null,null,null,null,null,null,null,'draft'),
('PPI-068',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-069',2025,'National',0.94,null,null,null,null,null,null,null,'draft'),
('PPI-069',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-070',2025,'National',15.0,null,null,null,null,null,null,null,'draft'),
('PPI-070',2026,'National',20.0,null,null,null,null,null,null,null,'draft'),
('PPI-071',2025,'National',41800000.0,null,null,null,null,null,null,null,'draft'),
('PPI-071',2026,'National',50000000.0,null,null,null,null,null,null,null,'draft'),
('PPI-072',2025,'National',5.0,null,null,null,null,null,null,null,'draft'),
('PPI-072',2026,'National',5.0,null,null,null,null,null,null,null,'draft'),
('PPI-073',2025,'National',0.9,null,null,null,null,null,null,null,'draft'),
('PPI-073',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-074',2025,'National',253.0,null,null,null,null,null,null,null,'draft'),
('PPI-074',2026,'National',30.0,null,null,null,null,null,null,null,'draft'),
('PPI-075',2026,'National',10.0,null,null,null,null,null,null,null,'draft'),
('PPI-076',2025,'National',0.3438,null,null,null,null,null,null,null,'draft'),
('PPI-076',2026,'National',0.2,null,null,null,null,null,null,null,'draft'),
('PPI-077',2025,'National',0.0,null,null,null,null,null,null,null,'draft'),
('PPI-077',2026,'National',0.5,null,null,null,null,null,null,null,'draft'),
('PPI-078',2025,'National',0.62,null,null,null,null,null,null,null,'draft'),
('PPI-078',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-079',2025,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-079',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-080',2025,'National',75.0,null,null,null,null,null,null,null,'draft'),
('PPI-080',2026,'National',77.0,null,null,null,null,null,null,null,'draft'),
('PPI-081',2025,'National',849.0,null,null,null,null,null,null,null,'draft'),
('PPI-081',2026,'National',750.0,null,null,null,null,null,null,null,'draft'),
('PPI-082',2025,'National',1293.0,null,null,null,null,null,null,null,'draft'),
('PPI-082',2026,'National',1250.0,null,null,null,null,null,null,null,'draft'),
('PPI-083',2027,'National',0.6,null,null,null,null,null,null,null,'draft'),
('PPI-084',2026,'National',60.0,null,null,null,null,null,null,null,'draft'),
('PPI-085',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-086',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-087',2026,'National',6.0,null,null,null,null,null,null,null,'draft'),
('PPI-088',2026,'National',0.6,null,null,null,null,null,null,null,'draft'),
('PPI-089',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-090',2026,'National',55.0,null,null,null,null,null,null,null,'draft'),
('PPI-091',2026,'National',2.0,null,null,null,null,null,null,null,'draft'),
('PPI-092',2026,'National',15.0,null,null,null,null,null,null,null,'draft'),
('PPI-093',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-094',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-095',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-096',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-097',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-098',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-099',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-100',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-101',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-102',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-103',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-104',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-105',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-106',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-107',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-108',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-109',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-110',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-111',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-112',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-113',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-114',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-115',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-116',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-117',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-118',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-119',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-120',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-121',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-122',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-123',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-124',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-125',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-126',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-127',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-128',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-129',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-130',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-131',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-132',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-133',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-134',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-135',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-136',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-137',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-138',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-139',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-140',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-141',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-142',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-143',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-144',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-145',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-146',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-147',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-148',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-149',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-150',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-151',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-152',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-153',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-154',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-155',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-156',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-157',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-158',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-159',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-160',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-161',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-162',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-163',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-164',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-165',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-166',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-167',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-168',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-169',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-170',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-171',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-172',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-173',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-174',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-175',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-176',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-177',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-178',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-179',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-180',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-181',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-182',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-183',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-184',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-185',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-186',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-187',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-188',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-189',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-190',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-191',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-192',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-193',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-194',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-195',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-196',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-197',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-198',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-199',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-200',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-201',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-202',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-203',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-204',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-205',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-206',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-207',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-208',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-209',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-210',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-211',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-212',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-213',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-214',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-215',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-216',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-217',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-218',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-219',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-220',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-221',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-222',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-223',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-224',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-225',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-226',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-227',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-228',2026,'National',0.3,null,null,null,null,null,null,null,'draft'),
('PPI-229',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-230',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-231',2026,'National',2.0,null,null,null,null,null,null,null,'draft'),
('PPI-232',2026,'National',0.9,null,null,null,null,null,null,null,'draft'),
('PPI-233',2026,'National',0.65,null,null,null,null,null,null,null,'draft'),
('PPI-234',2026,'National',0.9,null,null,null,null,null,null,null,'draft'),
('PPI-235',2026,'National',150.0,null,null,null,null,null,null,null,'draft'),
('PPI-236',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-237',2026,'National',0.95,null,null,null,null,null,null,null,'draft'),
('PPI-238',2026,'National',0.9,null,null,null,null,null,null,null,'draft'),
('PPI-239',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-240',2026,'National',80.0,null,null,null,null,null,null,null,'draft'),
('PPI-241',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-242',2026,'National',0.7,null,null,null,null,null,null,null,'draft'),
('PPI-243',2026,'National',250.0,null,null,null,null,null,null,null,'draft'),
('PPI-244',2026,'National',30.0,null,null,null,null,null,null,null,'draft'),
('PPI-245',2026,'National',2.0,null,null,null,null,null,null,null,'draft'),
('PPI-246',2026,'National',2000.0,null,null,null,null,null,null,null,'draft'),
('PPI-247',2026,'National',10.0,null,null,null,null,null,null,null,'draft'),
('PPI-248',2026,'National',0.1,null,null,null,null,null,null,null,'draft'),
('PPI-249',2024,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-249',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-250',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-251',2024,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-251',2026,'National',10.0,null,null,null,null,null,null,null,'draft'),
('PPI-252',2024,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-252',2026,'National',1.0,null,null,null,null,null,null,null,'draft'),
('PPI-253',2026,'National',0.8,null,null,null,null,null,null,null,'draft'),
('PPI-254',2024,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-254',2026,'National',5.0,null,null,null,null,null,null,null,'draft'),
('PPI-255',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-256',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-257',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-258',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-259',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-260',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-261',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-262',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-263',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-264',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-265',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-266',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-267',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-268',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-269',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-270',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-271',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-272',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-273',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-274',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-275',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-276',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-277',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-278',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-279',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-280',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-281',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-282',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-283',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-284',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-285',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-286',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-287',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-288',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-289',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-290',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-291',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-292',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-293',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-294',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-295',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-296',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-297',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-298',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-299',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-300',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-301',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-302',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-303',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-304',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-305',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-306',2026,'National',null,null,null,null,null,null,null,null,'draft'),
('PPI-307',2026,'National',null,null,null,null,null,null,null,null,'draft')
on conflict (indicator_id, year, region) do nothing;

select year, count(*) as baris,
       count(*) filter (where target is not null) as punya_target,
       count(*) filter (where coalesce(q1,q2,q3,q4) is not null) as punya_actual
from public.indicator_years where region = 'National'
group by year order by year;
