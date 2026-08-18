using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

/// <summary>
/// Penyimpanan konfigurasi dinamis. Seluruh kebijakan toko yang boleh diubah admin
/// wajib berada di sini, bukan sebagai konstanta di kode (PRD bagian 37).
/// </summary>
public class SystemSetting : TableSystemSettingModel
{
    public SystemSetting()
    {
        DateCreated = DateTime.Now;
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("system_settings");
        builder.HasKey(x => x.SettingKey);
        builder.Property(x => x.SettingKey).ValueGeneratedNever().HasMaxLength(96);
        builder.Property(x => x.SettingValue).HasMaxLength(2048);
        builder.Property(x => x.ValueType).IsRequired().HasMaxLength(16);
        builder.Property(x => x.GroupName).IsRequired().HasMaxLength(32);
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(128);
        builder.Property(x => x.Description).HasMaxLength(512);
        builder.HasIndex(x => x.GroupName);
    }
}

/// <summary>
/// Pemetaan model ke entity ditulis eksplisit agar tidak menambah dependency mapping
/// untuk pekerjaan yang hanya beberapa baris.
/// </summary>
public static class MapperSystemSetting
{
    public static void ApplyEdit(this SystemSetting entity, CreateEditSystemSettingModel model)
    {
        entity.SettingValue = model.SettingValue;
    }
}
