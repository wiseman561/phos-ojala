using AutoMapper;
using Phos.Data.Entities;
using Phos.Identity.Models;
using System;

namespace Phos.Identity.Mapping
{
    public class ApiMappingProfile : AutoMapper.Profile
    {
        public ApiMappingProfile()
        {
            CreateMap<ApplicationUser, ProfileDto>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.LockoutEnd.HasValue ? src.LockoutEnd.Value.UtcDateTime : DateTime.UtcNow))
                .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore());
                
            // Add a mapping for UserProfile if needed
            CreateMap<ApplicationUser, UserProfile>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.FirstName, o => o.MapFrom(s => s.FirstName))
                .ForMember(d => d.LastName, o => o.MapFrom(s => s.LastName))
                .ReverseMap();
        }
    }
} 