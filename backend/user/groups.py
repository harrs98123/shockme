from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth.utils import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])

@router.get("/", response_model=List[schemas.GroupOut])
def get_groups(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    groups = db.query(models.Group).all()
    
    results = []
    for g in groups:
        member_count = db.query(models.GroupMember).filter(models.GroupMember.group_id == g.id).count()
        is_member = False
        is_creator = False
        if current_user:
            is_member = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == g.id,
                models.GroupMember.user_id == current_user.id
            ).first() is not None
            is_creator = g.creator_id == current_user.id
        
        # Attach virtual fields for Pydantic validation
        g.member_count = member_count
        g.is_member = is_member
        g.is_creator = is_creator
        
        results.append(schemas.GroupOut.model_validate(g))
    
    return results

@router.post("/", response_model=schemas.GroupOut)
def create_group(
    group_data: schemas.GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check 3 group limit
    owned_count = db.query(models.Group).filter(models.Group.creator_id == current_user.id).count()
    if owned_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only create up to 3 groups."
        )
    
    new_group = models.Group(
        name=group_data.name,
        description=group_data.description,
        image_url=group_data.image_url,
        creator_id=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Creator becomes first member automatically
    member = models.GroupMember(group_id=new_group.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    
    # Attach virtual fields for Pydantic validation
    new_group.member_count = 1
    new_group.is_member = True
    new_group.is_creator = True
    
    return schemas.GroupOut.model_validate(new_group)

@router.get("/{group_id}", response_model=schemas.GroupOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    member_count = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).count()
    is_member = False
    is_creator = False
    if current_user:
        is_member = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == current_user.id
        ).first() is not None
        is_creator = group.creator_id == current_user.id
    
    # Attach virtual fields for Pydantic validation
    group.member_count = member_count
    group.is_member = is_member
    group.is_creator = is_creator
    
    return schemas.GroupOut.model_validate(group)

@router.patch("/{group_id}", response_model=schemas.GroupOut)
def update_group(
    group_id: int,
    group_data: schemas.GroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can edit this group.")
    
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.image_url is not None:
        group.image_url = group_data.image_url
        
    db.commit()
    db.refresh(group)
    
    # Attach virtual fields for Pydantic validation
    group.member_count = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).count()
    group.is_member = True
    group.is_creator = True
    
    return schemas.GroupOut.model_validate(group)

@router.get("/{group_id}/members", response_model=List[schemas.GroupMemberOut])
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    
    for m in members:
        m.user_name = m.user.name
        
    return members

@router.delete("/{group_id}/members/{user_id}")
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can remove members.")
        
    if user_id == group.creator_id:
        raise HTTPException(status_code=400, detail="The creator cannot be removed from the group.")
        
    member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}

@router.post("/{group_id}/join")
def join_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    existing = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user.id
    ).first()
    
    if existing:
        return {"message": "Already a member"}
    
    member = models.GroupMember(group_id=group_id, user_id=current_user.id)
    db.add(member)
    db.commit()
    return {"message": "Joined successfully"}

@router.get("/{group_id}/posts", response_model=List[schemas.GroupPostOut])
def get_group_posts(group_id: int, db: Session = Depends(get_db)):
    posts = db.query(models.GroupPost).filter(models.GroupPost.group_id == group_id).order_by(models.GroupPost.created_at.desc()).all()
    
    results = []
    for p in posts:
        # Attach virtual fields for Pydantic validation
        p.user_name = p.user.name
        
        # Add comments and their user names
        for c in p.comments:
            c.user_name = c.user.name
        
        results.append(schemas.GroupPostOut.model_validate(p))
        
    return results

@router.post("/{group_id}/posts", response_model=schemas.GroupPostOut)
def create_group_post(
    group_id: int,
    post_data: schemas.GroupPostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check membership
    is_member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == current_user.id
    ).first() is not None
    
    if not is_member:
        raise HTTPException(status_code=403, detail="You must join the group to post.")
    
    new_post = models.GroupPost(
        group_id=group_id,
        user_id=current_user.id,
        content=post_data.content
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Attach virtual fields for Pydantic validation
    new_post.user_name = current_user.name
    
    return schemas.GroupPostOut.model_validate(new_post)

@router.post("/posts/{post_id}/comments", response_model=schemas.GroupCommentOut)
def create_group_comment(
    post_id: int,
    comment_data: schemas.GroupCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.GroupPost).filter(models.GroupPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check membership
    is_member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == post.group_id,
        models.GroupMember.user_id == current_user.id
    ).first() is not None
    
    if not is_member:
        raise HTTPException(status_code=403, detail="You must join the group to comment.")

    new_comment = models.GroupComment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Attach virtual fields for Pydantic validation
    new_comment.user_name = current_user.name
    
    return schemas.GroupCommentOut.model_validate(new_comment)

@router.get("/my/posts", response_model=List[schemas.GroupPostOut])
def get_my_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posts = db.query(models.GroupPost).filter(models.GroupPost.user_id == current_user.id).order_by(models.GroupPost.created_at.desc()).all()
    
    results = []
    for p in posts:
        p.user_name = p.user.name
        p.group_name = p.group.name
        for c in p.comments:
            c.user_name = c.user.name
        results.append(schemas.GroupPostOut.model_validate(p))
        
    return results


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete the group.")
        
    db.delete(group)
    db.commit()
    return {"message": "Group deleted successfully"}
