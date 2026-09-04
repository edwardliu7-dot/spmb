import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const pendaftarTable = pgTable("pendaftar", {
  id: serial("id").primaryKey(),
  nis: text("nis"),
  jenjang: text("jenjang").notNull(),
  nama_calon: text("nama_calon").notNull(),
  nama_panggilan: text("nama_panggilan").notNull(),
  jenis_kelamin: text("jenis_kelamin").notNull(),
  tempat_lahir: text("tempat_lahir").notNull(),
  tanggal_lahir: date("tanggal_lahir", { mode: "string" }).notNull(),
  nisn: text("nisn"),
  nik_anak: text("nik_anak").notNull(),
  alamat_domisili: text("alamat_domisili").notNull(),
  anak_ke: integer("anak_ke").notNull(),
  jumlah_saudara: integer("jumlah_saudara").notNull(),
  status_anak: text("status_anak").notNull(),
  agama: text("agama").notNull(),
  warga_negara: text("warga_negara").notNull(),
  tinggi_badan: real("tinggi_badan").notNull(),
  berat_badan: real("berat_badan").notNull(),
  riwayat_penyakit: text("riwayat_penyakit"),
  transportasi: text("transportasi").notNull(),
  jarak_sekolah: text("jarak_sekolah").notNull(),
  nama_sekolah_asal: text("nama_sekolah_asal"),
  tahun_lulus: integer("tahun_lulus"),
  alamat_sekolah_asal: text("alamat_sekolah_asal"),
  nomor_kk: text("nomor_kk").notNull(),
  nik_ayah: text("nik_ayah").notNull(),
  nik_ibu: text("nik_ibu"),
  nomor_hp_orangtua: text("nomor_hp_orangtua").notNull(),
  email: text("email").notNull(),
  nama_ayah: text("nama_ayah").notNull(),
  ttl_ayah: text("ttl_ayah").notNull(),
  pendidikan_ayah: text("pendidikan_ayah").notNull(),
  pekerjaan_ayah: text("pekerjaan_ayah").notNull(),
  penghasilan_ayah: text("penghasilan_ayah").notNull(),
  instansi_jabatan_ayah: text("instansi_jabatan_ayah").notNull(),
  nama_ibu: text("nama_ibu").notNull(),
  ttl_ibu: text("ttl_ibu").notNull(),
  pendidikan_ibu: text("pendidikan_ibu").notNull(),
  pekerjaan_ibu: text("pekerjaan_ibu").notNull(),
  penghasilan_ibu: text("penghasilan_ibu").notNull(),
  instansi_jabatan_ibu: text("instansi_jabatan_ibu").notNull(),
  nama_wali: text("nama_wali"),
  hubungan_wali: text("hubungan_wali"),
  status: text("status").notNull().default("Baru"),
  foto_3x4_path: text("foto_3x4_path"),
  akte_lahir_path: text("akte_lahir_path"),
  kartu_keluarga_path: text("kartu_keluarga_path"),
  ktp_orangtua_path: text("ktp_orangtua_path"),
  bukti_bayar_path: text("bukti_bayar_path"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nisUniqueIndex: uniqueIndex("pendaftar_nis_unique").on(table.nis),
}));

export const committeeNotificationTable = pgTable("committee_notification", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => pendaftarTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  jenjang: text("jenjang").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const committeeNotificationReadTable = pgTable("committee_notification_read", {
  id: serial("id").primaryKey(),
  notification_id: integer("notification_id").notNull().references(() => committeeNotificationTable.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  read_at: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  notificationReaderUnique: uniqueIndex("committee_notification_reader_unique").on(table.notification_id, table.username),
}));

export const applicationStatusHistoryTable = pgTable("application_status_history", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").notNull().references(() => pendaftarTable.id, { onDelete: "cascade" }),
  previous_status: text("previous_status"),
  next_status: text("next_status").notNull(),
  changed_by: text("changed_by").notNull(),
  changed_at: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const committeeAuditLogTable = pgTable("committee_audit_log", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  action: text("action").notNull(),
  application_id: integer("application_id").references(() => pendaftarTable.id, { onDelete: "set null" }),
  details: text("details"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPendaftarSchema = createInsertSchema(pendaftarTable).omit({
  id: true,
  created_at: true,
});

export type InsertPendaftar = z.infer<typeof insertPendaftarSchema>;
export type Pendaftar = typeof pendaftarTable.$inferSelect;