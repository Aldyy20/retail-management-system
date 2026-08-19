using POS.Server.Services;

namespace POS.Tests;

/// <summary>
/// Nama berkas unggahan adalah batas kepercayaan: nilainya datang dari frontend dan
/// dipakai menyusun jalur berkas di server. Yang boleh lolos hanya bentuk yang memang
/// dibuat server sendiri.
/// </summary>
public class UploadFileNameTests
{
    [Theory]
    [InlineData("0123456789abcdef0123456789abcdef.jpg")]
    [InlineData("0123456789abcdef0123456789abcdef.jpeg")]
    [InlineData("0123456789abcdef0123456789abcdef.png")]
    [InlineData("0123456789abcdef0123456789abcdef.webp")]
    public void IsValidFileName_BentukYangDibuatServer_Diterima(string fileName)
    {
        Assert.True(FileMethods.IsValidFileName(fileName));
    }

    [Theory]
    [InlineData("../../appsettings.json")]
    [InlineData("..\appsettings.json")]
    [InlineData("product/0123456789abcdef0123456789abcdef.jpg")]
    [InlineData("0123456789abcdef0123456789abcdef.svg")]
    [InlineData("0123456789abcdef0123456789abcdef.exe")]
    [InlineData("0123456789abcdef0123456789abcdef")]
    [InlineData("foto liburan.jpg")]
    [InlineData("")]
    public void IsValidFileName_NamaDariLuar_Ditolak(string fileName)
    {
        Assert.False(FileMethods.IsValidFileName(fileName));
    }

    /// <summary>Nama yang tidak sah tidak pernah sampai memeriksa berkas di disk.</summary>
    [Fact]
    public void Exists_NamaTidakSah_LangsungFalse()
    {
        Assert.False(FileMethods.Exists(AppData.UploadFolderProduct, "../../appsettings.json"));
    }
}
